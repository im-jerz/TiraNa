from flask import Blueprint

reviews_bp = Blueprint("reviews", __name__, url_prefix="/api/host/property-reviews")

from app.blueprints.reviews import routes  # noqa: E402, F401