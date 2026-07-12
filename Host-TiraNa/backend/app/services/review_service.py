"""
Review service.

Calls the CLIENT backend API (Node.js/Express, CockroachDB) via HTTP
to fetch reviews data — never connects to the client database directly.

Client API base URL is configured via CLIENT_API_URL in .env.
Default: http://localhost:5000

Endpoints called on the client API:
  GET /api/host/property-reviews        list reviews
  GET /api/host/property-reviews/stats  aggregated stats
"""

import os

import requests
from app.models.property import Property


# ─── Client API helper ────────────────────────────────────────────────────────

def _client_url() -> str:
    return os.environ.get("CLIENT_API_URL", "http://localhost:5000").rstrip("/")


def _get(path: str, params: dict) -> dict:
    """
    GET {CLIENT_API_URL}{path}?{params}
    Returns parsed JSON `data` dict on success.
    Raises RuntimeError on network or HTTP errors.
    """
    url = f"{_client_url()}{path}"
    try:
        resp = requests.get(url, params=params, timeout=10)
        resp.raise_for_status()
    except requests.exceptions.RequestException as e:
        raise RuntimeError(f"Client API unreachable: {e}") from e

    payload = resp.json()

    # Accept both { "data": {...} } and { "reviews": [...] } shapes
    if "data" in payload:
        return payload["data"]
    return payload


# ─── Host property lookup ─────────────────────────────────────────────────────

def _get_host_property_ids(host_id: int) -> list[str]:
    """Return list of property IDs (as strings) owned by this host."""
    props = Property.query.filter_by(host_id=host_id).all()
    return [str(p.id) for p in props]


def _get_host_property_map(host_id: int) -> dict:
    """{ str(property_id): { "name": ..., "property_type": ... } }"""
    props = Property.query.filter_by(host_id=host_id).all()
    return {str(p.id): {"name": p.title, "property_type": p.property_type} for p in props}


# ─── Public service functions ─────────────────────────────────────────────────

def get_reviews(host_id: int, params: dict) -> dict:
    """
    Fetch reviews for all properties owned by this host.

    `params` may contain any combination of:
        property_ids  — comma-separated; filtered to only host-owned ones
        page, per_page, sort, search
    Returns the data dict from the client API.
    """
    prop_map = _get_host_property_map(host_id)
    all_ids = list(prop_map.keys())

    if not all_ids:
        return {"reviews": [], "total": 0, "page": 1, "per_page": 20}

    # If caller requested specific IDs, intersect with host-owned ones
    requested = [s.strip() for s in params.get("property_ids", "").split(",") if s.strip()]
    if requested:
        safe_ids = [pid for pid in requested if pid in prop_map]
    else:
        safe_ids = all_ids

    if not safe_ids:
        return {"reviews": [], "total": 0, "page": 1, "per_page": 20}

    query_params = {**params, "property_ids": ",".join(safe_ids)}
    data = _get("/api/host/property-reviews", query_params)

    # Enrich each review with property name from host Oracle DB
    for review in data.get("reviews", []):
        pid = str(review.get("property_id", ""))
        if pid in prop_map:
            review.setdefault("property", {})
            review["property"]["name"] = prop_map[pid]["name"]

    return data


def get_review_stats(host_id: int, property_ids: str | None = None) -> dict:
    """
    Fetch aggregated rating stats for host's properties.
    Returns the data dict from the client API.
    """
    prop_map = _get_host_property_map(host_id)
    all_ids = list(prop_map.keys())

    if not all_ids:
        return _empty_stats()

    if property_ids:
        requested = [s.strip() for s in property_ids.split(",") if s.strip()]
        safe_ids = [pid for pid in requested if pid in prop_map]
    else:
        safe_ids = all_ids

    if not safe_ids:
        return _empty_stats()

    try:
        return _get("/api/host/property-reviews/stats", {"property_ids": ",".join(safe_ids)})
    except RuntimeError:
        return _empty_stats()


def _empty_stats() -> dict:
    return {
        "total": 0,
        "avg_rating": None,
        "distribution": {},
        "subcategory_averages": {
            "accuracy": None, "check_in": None, "cleanliness": None,
            "communication": None, "location": None, "value": None,
        },
    }