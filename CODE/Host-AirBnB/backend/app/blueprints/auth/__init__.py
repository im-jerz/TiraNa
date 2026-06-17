from flask import Blueprint

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

# Imported at the bottom so route decorators register against auth_bp
# above without causing a circular import.
from app.blueprints.auth import routes  # noqa: E402,F401
