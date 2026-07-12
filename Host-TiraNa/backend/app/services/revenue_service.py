"""
Revenue service.

Calls the CLIENT backend API (Node.js/Express) via HTTP to fetch
booking data — never connects to the client database directly.

Client API base URL is configured via CLIENT_API_URL in .env.
Default: http://localhost:5000

Revenue-counting rules (enforced on the client API side):
  - Gross revenue  = sum of total_price for bookings with status IN
                     ('confirmed', 'completed')
  - Cancelled / refund_completed / pending are EXCLUDED
  - Commission     = 13% of gross (COMMISSION_RATE)
  - Net revenue    = gross - commission
  - Payout history = one payout row per completed-booking month (simulated)
"""

import os
from datetime import date
from decimal import Decimal, ROUND_HALF_UP

import requests
from flask import current_app

from app.models.property import Property

COMMISSION_RATE = Decimal("0.13")
MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
               "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


# ─── Client API helper ───────────────────────────────────────────────────────

def _client_api_url() -> str:
    return os.environ.get("CLIENT_API_URL", "http://localhost:5000").rstrip("/")


def _fetch_revenue_data(property_ids: list[int], start: date, end: date) -> dict:
    """
    Call GET /api/host/revenue on the client backend.
    Returns the parsed JSON `data` dict.
    Raises RuntimeError on HTTP or network errors.
    """
    if not property_ids:
        return {
            "summary": {"gross": 0, "booking_count": 0},
            "monthly": [],
            "by_property": [],
            "payouts": [],
        }

    url = f"{_client_api_url()}/api/host/revenue"
    params = {
        "property_ids": ",".join(str(pid) for pid in property_ids),
        "start": start.isoformat(),
        "end": end.isoformat(),
    }

    try:
        resp = requests.get(url, params=params, timeout=10)
        resp.raise_for_status()
    except requests.exceptions.RequestException as e:
        raise RuntimeError(f"Client API unreachable: {e}") from e

    payload = resp.json()
    if "data" not in payload:
        raise RuntimeError("Unexpected response from client API")

    return payload["data"]


# ─── Host property lookup ────────────────────────────────────────────────────

def _get_host_properties(host_id: int) -> dict:
    """{ property_id (int): {name, property_type} }"""
    props = Property.query.filter_by(host_id=host_id).all()
    return {p.id: {"name": p.title, "property_type": p.property_type} for p in props}


# ─── Period helpers ──────────────────────────────────────────────────────────

def _period_bounds(period: str) -> tuple[date, date]:
    today = date.today()
    months = {"this_month": 1, "last_3_months": 3, "last_6_months": 6}.get(period, 6)

    year, month = today.year, today.month - months
    while month <= 0:
        month += 12
        year -= 1
    return date(year, month, 1), today


# ─── Commission helpers ──────────────────────────────────────────────────────

def _calc(gross_float: float) -> tuple[int, int, int]:
    """Return (gross, commission, net) as ints (PHP centavo-rounded)."""
    gross = Decimal(str(gross_float))
    commission = (gross * COMMISSION_RATE).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
    net = gross - commission
    return int(gross), int(commission), int(net)


# ─── Public service functions ────────────────────────────────────────────────

def get_summary(host_id: int, period: str) -> dict:
    """KPI cards: gross, commission, net, avg_per_booking, booking_count."""
    start, end = _period_bounds(period)
    host_props = _get_host_properties(host_id)

    data = _fetch_revenue_data(list(host_props.keys()), start, end)
    gross_f = data["summary"]["gross"]
    booking_count = data["summary"]["booking_count"]

    gross, commission, net = _calc(gross_f)
    avg = int(gross / booking_count) if booking_count else 0

    return {
        "period": period,
        "gross": gross,
        "commission": commission,
        "net": net,
        "avg_per_booking": avg,
        "booking_count": booking_count,
        "commission_rate": float(COMMISSION_RATE),
    }


def get_monthly(host_id: int, period: str) -> dict:
    """Month-by-month breakdown for bar chart and earnings table."""
    start, end = _period_bounds(period)
    host_props = _get_host_properties(host_id)

    data = _fetch_revenue_data(list(host_props.keys()), start, end)

    months = []
    for row in data["monthly"]:
        gross, commission, net = _calc(row["gross"])
        months.append({
            "month": MONTH_NAMES[row["mo"] - 1],
            "year": row["yr"],
            "gross": gross,
            "commission": commission,
            "net": net,
            "booking_count": row["booking_count"],
        })

    return {"period": period, "months": months}


def get_by_property(host_id: int, period: str) -> dict:
    """Per-property revenue breakdown table."""
    start, end = _period_bounds(period)
    host_props = _get_host_properties(host_id)

    data = _fetch_revenue_data(list(host_props.keys()), start, end)

    # Index client data by property_id
    revenue_map = {row["property_id"]: row for row in data["by_property"]}

    result = []
    for prop_id, prop_info in host_props.items():
        row = revenue_map.get(str(prop_id))
        gross_f = row["gross"] if row else 0
        booking_count = row["booking_count"] if row else 0
        gross, commission, net = _calc(gross_f)
        result.append({
            "property_id": prop_id,
            "name": prop_info["name"],
            "property_type": prop_info["property_type"],
            "booking_count": booking_count,
            "gross": gross,
            "commission": commission,
            "net": net,
        })

    result.sort(key=lambda x: x["gross"], reverse=True)

    return {
        "period": period,
        "properties": result,
        "totals": {
            "gross": sum(r["gross"] for r in result),
            "commission": sum(r["commission"] for r in result),
            "net": sum(r["net"] for r in result),
            "booking_count": sum(r["booking_count"] for r in result),
        },
    }


def get_payouts(host_id: int) -> dict:
    """Payout history derived from completed bookings, grouped by month."""
    start, end = _period_bounds("last_6_months")  # full history from client side
    host_props = _get_host_properties(host_id)

    data = _fetch_revenue_data(list(host_props.keys()), start, end)

    today = date.today()
    groups: dict = {}

    for row in data["payouts"]:
        key = (row["yr"], row["mo"])
        if key not in groups:
            groups[key] = {"refs": [], "gross": Decimal("0"), "yr": row["yr"], "mo": row["mo"]}
        groups[key]["refs"].append(str(row["id"])[:8].upper())
        groups[key]["gross"] += Decimal(str(row["total_price"]))

    payouts = []
    total_paid_out = Decimal("0")

    for (yr, mo), grp in sorted(groups.items(), reverse=True):
        gross, commission, net = _calc(float(grp["gross"]))
        is_current = (yr == today.year and mo == today.month)
        status = "pending" if is_current else "processed"

        payout_mo = mo + 1 if mo < 12 else 1
        payout_yr = yr if mo < 12 else yr + 1
        payout_date = f"{MONTH_NAMES[payout_mo - 1]} 15, {payout_yr}"

        refs = grp["refs"][:4]
        ref_str = ", ".join(refs)
        if len(grp["refs"]) > 4:
            ref_str += f" +{len(grp['refs']) - 4} more"

        payouts.append({
            "date": payout_date,
            "gross": gross,
            "commission": commission,
            "amount": net,
            "booking_refs": ref_str,
            "booking_count": len(grp["refs"]),
            "status": status,
        })

        if status == "processed":
            total_paid_out += Decimal(net)

    return {
        "payouts": payouts,
        "total_paid_out": int(total_paid_out),
    }