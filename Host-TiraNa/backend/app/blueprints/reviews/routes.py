"""
Reviews routes — host dashboard.

    GET  /api/host/property-reviews          list reviews for host properties
    GET  /api/host/property-reviews/stats    aggregated rating stats

Query params (list endpoint):
    property_ids   comma-separated property IDs (optional; defaults to all host properties)
    page           page number, default 1
    per_page       results per page, default 20 (max 100)
    sort           newest | oldest | highest | lowest  (default: newest)
    search         substring match on guest name or review text

Query params (stats endpoint):
    property_ids   comma-separated property IDs (optional)
"""

from flask import request, g

from app.blueprints.reviews import reviews_bp
from app.middleware.auth_middleware import host_required
from app.services import review_service
from app.utils.response import success_response, error_response


@reviews_bp.route("", methods=["GET"])
@host_required
def list_reviews():
    """Proxy to client API: returns paginated reviews for host properties."""
    # Pass all query params straight through to the client API
    params = {k: v for k, v in request.args.items()}
    try:
        data = review_service.get_reviews(g.current_host.id, params)
    except RuntimeError as e:
        return error_response(str(e), status=502)
    except Exception as e:
        return error_response(f"Could not fetch reviews: {str(e)}", status=500)
    return success_response(data=data)


@reviews_bp.route("/stats", methods=["GET"])
@host_required
def review_stats():
    """Proxy to client API: returns aggregated rating stats."""
    property_ids = request.args.get("property_ids")
    try:
        data = review_service.get_review_stats(g.current_host.id, property_ids)
    except RuntimeError as e:
        return error_response(str(e), status=502)
    except Exception as e:
        return error_response(f"Could not fetch review stats: {str(e)}", status=500)
    return success_response(data=data)