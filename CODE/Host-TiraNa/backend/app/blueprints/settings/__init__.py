from flask import Blueprint
 
settings_bp = Blueprint("settings", __name__, url_prefix="/api/settings")
 
from app.blueprints.settings import routes