"""
Revenue routes.

    GET  /api/host/revenue/summary       ?period=last_6_months
    GET  /api/host/revenue/monthly       ?period=last_6_months
    GET  /api/host/revenue/by-property   ?period=last_6_months
    GET  /api/host/revenue/payouts

period values: this_month | last_3_months | last_6_months  (default: last_6_months)

All routes require a valid host JWT (@host_required).
"""

from flask import request, g

from app.blueprints.revenue import revenue_bp
from app.middleware.auth_middleware import host_required
from app.services import revenue_service
from app.utils.response import success_response, error_response

VALID_PERIODS = {"this_month", "last_3_months", "last_6_months"}
DEFAULT_PERIOD = "last_6_months"


def _get_period() -> str:
    period = request.args.get("period", DEFAULT_PERIOD).lower().strip()
    if period not in VALID_PERIODS:
        return DEFAULT_PERIOD
    return period


@revenue_bp.route("/summary", methods=["GET"])
@host_required
def summary():
    """KPI cards: gross, commission, net, avg_per_booking, booking_count."""
    try:
        data = revenue_service.get_summary(g.current_host.id, _get_period())
    except Exception as e:
        return error_response(f"Could not fetch revenue summary: {str(e)}", status=500)
    return success_response(data=data)


@revenue_bp.route("/monthly", methods=["GET"])
@host_required
def monthly():
    """Month-by-month breakdown for bar chart and earnings report table."""
    try:
        data = revenue_service.get_monthly(g.current_host.id, _get_period())
    except Exception as e:
        return error_response(f"Could not fetch monthly revenue: {str(e)}", status=500)
    return success_response(data=data)


@revenue_bp.route("/by-property", methods=["GET"])
@host_required
def by_property():
    """Per-property revenue breakdown table."""
    try:
        data = revenue_service.get_by_property(g.current_host.id, _get_period())
    except Exception as e:
        return error_response(f"Could not fetch property revenue: {str(e)}", status=500)
    return success_response(data=data)


@revenue_bp.route("/payouts", methods=["GET"])
@host_required
def payouts():
    """Payout history derived from completed bookings."""
    try:
        data = revenue_service.get_payouts(g.current_host.id)
    except Exception as e:
        return error_response(f"Could not fetch payout history: {str(e)}", status=500)
    return success_response(data=data)