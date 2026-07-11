from flask import Blueprint

wallet_bp = Blueprint("wallet", __name__, url_prefix="/api/host/wallet")

from app.blueprints.wallet import routes  # noqa: E402, F401
