"""
Flask application factory.

Usage (see wsgi.py):

    from app import create_app
    app = create_app("development")
"""

from flask import Flask, send_from_directory

from config import config_by_name
from app.extensions import db, migrate, bcrypt, jwt, ma, cors, mail
from app.blueprints import register_blueprints
from app.utils.response import error_response
from app.services.upload_service import PROPERTY_UPLOAD_ROOT


def create_app(config_name: str = "development") -> Flask:
    app = Flask(__name__)
    app.config.from_object(config_by_name[config_name])

    db.init_app(app)
    migrate.init_app(app, db)
    bcrypt.init_app(app)
    jwt.init_app(app)
    ma.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}})
    mail.init_app(app)

    register_blueprints(app)

    @app.route("/uploads/properties/<path:filepath>")
    def uploaded_property_photo(filepath):
        directory = f"{PROPERTY_UPLOAD_ROOT}/properties"
        return send_from_directory(directory, filepath)

    @jwt.token_in_blocklist_loader
    def check_if_token_revoked(jwt_header, jwt_payload):
        from app.blueprints.auth.routes import is_token_revoked
        return is_token_revoked(jwt_header, jwt_payload)

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return error_response("Session expired. Please sign in again.", status=401)

    @jwt.invalid_token_loader
    def invalid_token_callback(reason):
        return error_response("Invalid authentication token.", status=401)

    @jwt.unauthorized_loader
    def missing_token_callback(reason):
        return error_response("Authentication token is missing.", status=401)

    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        return error_response("Token has been revoked. Please sign in again.", status=401)

    @app.errorhandler(404)
    def not_found(e):
        return error_response("Resource not found.", status=404)

    @app.errorhandler(413)
    def payload_too_large(e):
        return error_response(
            "Upload too large. Check individual file sizes and try again.", status=413
        )

    @app.errorhandler(500)
    def server_error(e):
        app.logger.exception(e)
        return error_response("Something went wrong. Please try again.", status=500)

    return app
