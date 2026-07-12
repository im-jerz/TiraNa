from flask import Blueprint

listings_bp = Blueprint("listings", __name__, url_prefix="/api/listings")

from app.blueprints.listings import routes
