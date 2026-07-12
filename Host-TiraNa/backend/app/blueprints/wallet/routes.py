"""
Wallet routes.

    POST /api/host/wallet/withdraw   — submit withdrawal request
    GET  /api/host/wallet/withdrawals — list host's withdrawal history

Calls Admin-TiraNa's internal API for withdrawal operations.
"""

import os
import requests as http_requests
from flask import request, g

from app.blueprints.wallet import wallet_bp
from app.middleware.auth_middleware import host_required
from app.utils.response import success_response, error_response
from app.models.property import Property


def _client_api_url():
    return os.environ.get("CLIENT_API_URL", "http://localhost:5000").rstrip("/")


def _admin_api_url():
    return os.environ.get("ADMIN_API_URL", "http://host.docker.internal:5002").rstrip("/")


def _admin_api_key():
    return os.environ.get("ADMIN_INTERNAL_API_KEY", "tirana-internal-secret-key")


@wallet_bp.route("/withdraw", methods=["POST"])
@host_required
def submit_withdrawal():
    """Submit a withdrawal request via Admin-TiraNa API."""
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

    # Call Admin-TiraNa API to create withdrawal
    try:
        resp = http_requests.post(
            f"{_admin_api_url()}/api/internal/withdrawals/",
            params={
                "host_id": host.id,
                "host_name": host_name,
                "host_email": host.email,
                "amount": float(amount),
                "method": method,
            },
            headers={"X-Internal-API-Key": _admin_api_key()},
            timeout=15,
        )
        if not resp.ok:
            detail = resp.json().get("detail", "Failed to create withdrawal request.")
            return error_response(detail, status=resp.status_code)
    except Exception:
        return error_response("Failed to create withdrawal request. Admin API unavailable.", status=502)

    return success_response(message="Withdrawal request submitted successfully.")


@wallet_bp.route("/withdrawals", methods=["GET"])
@host_required
def list_withdrawals():
    """List the authenticated host's withdrawal history via Admin-TiraNa API."""
    host = g.current_host

    try:
        resp = http_requests.get(
            f"{_admin_api_url()}/api/internal/withdrawals/",
            params={"host_id": host.id},
            headers={"X-Internal-API-Key": _admin_api_key()},
            timeout=15,
        )
        if not resp.ok:
            return success_response(data=[])

        data = resp.json().get("data", [])
        return success_response(data=data)
    except Exception:
        return success_response(data=[])
