"""
Wallet routes.

    POST /api/host/wallet/withdraw   — submit withdrawal request
    GET  /api/host/wallet/withdrawals — list host's withdrawal history

Writes directly to the shared PostgreSQL withdrawals table
(Admin-TiraNa's database). No HTTP calls, no API keys.
"""

import os
import requests as http_requests
from flask import request, g

from app.blueprints.wallet import wallet_bp
from app.middleware.auth_middleware import host_required
from app.utils.response import success_response, error_response
from app.models.property import Property
from app.shared_db import SharedWithdrawal, SharedSession


def _client_api_url():
    return os.environ.get("CLIENT_API_URL", "http://localhost:5000").rstrip("/")


@wallet_bp.route("/withdraw", methods=["POST"])
@host_required
def submit_withdrawal():
    """Submit a withdrawal request — writes directly to shared DB."""
    host = g.current_host
    data = request.get_json() or {}

    amount = data.get("amount")
    method = data.get("method")

    if not amount or float(amount) <= 0:
        return error_response("A valid withdrawal amount is required.", status=400)
    if not method:
        return error_response("A payout method is required.", status=400)

    # Resolve host name
    try:
        profile = host.profile
        host_name = profile.full_name if profile else host.email.split("@")[0]
    except Exception:
        host_name = host.email.split("@")[0]

    # Get host's property IDs from Host-TiraNa DB
    properties = Property.query.filter_by(host_id=host.id).all()
    prop_ids = [str(p.id) for p in properties]

    if not prop_ids:
        return error_response("You have no properties to withdraw from.", status=400)

    # Validate available balance via Client-TiraNa
    available = 0
    try:
        summary_resp = http_requests.get(
            f"{_client_api_url()}/api/host/wallet/summary",
            params={"property_ids": ",".join(prop_ids)},
            timeout=10,
        )
        if summary_resp.ok:
            available = float(summary_resp.json().get("data", {}).get("available_balance", 0))
    except Exception:
        return error_response("Could not verify your balance. Please try again.", status=502)

    if float(amount) > available:
        return error_response(
            f"Insufficient balance. Available: ₱{available:,.2f}",
            status=400,
        )

    # Insert directly into shared PostgreSQL withdrawals table
    session = SharedSession()
    try:
        withdrawal = SharedWithdrawal(
            host_id=host.id,
            host_name=host_name,
            host_email=host.email,
            amount=float(amount),
            method=method,
            status="pending",
        )
        session.add(withdrawal)
        session.commit()
    except Exception as e:
        session.rollback()
        return error_response("Failed to create withdrawal request.", status=500)
    finally:
        session.close()

    return success_response(message="Withdrawal request submitted successfully.")


@wallet_bp.route("/withdrawals", methods=["GET"])
@host_required
def list_withdrawals():
    """List the authenticated host's withdrawal history from shared DB."""
    host = g.current_host

    session = SharedSession()
    try:
        withdrawals = (
            session.query(SharedWithdrawal)
            .filter(SharedWithdrawal.host_id == host.id)
            .order_by(SharedWithdrawal.created_at.desc())
            .all()
        )

        data = [
            {
                "id": w.id,
                "amount": float(w.amount),
                "method": w.method,
                "status": w.status,
                "reference_number": w.reference_number,
                "rejection_reason": w.rejection_reason,
                "created_at": w.created_at.isoformat() if w.created_at else None,
                "updated_at": w.updated_at.isoformat() if w.updated_at else None,
            }
            for w in withdrawals
        ]

        return success_response(data=data)
    except Exception:
        return success_response(data=[])
    finally:
        session.close()
