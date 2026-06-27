from flask import Blueprint

revenue_bp = Blueprint("revenue", __name__, url_prefix="/api/host/revenue")

from app.blueprints.revenue import routes  # noqa: E402, F401