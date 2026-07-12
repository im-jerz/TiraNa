"""
Auth middleware.

Wraps flask_jwt_extended's @jwt_required and loads the authenticated
Host record into Flask's `g` object, so route handlers in other
blueprints (properties, bookings, wallet, etc.) don't need to
re-query it every time.

Usage in another blueprint:

    from app.middleware.auth_middleware import host_required
    from flask import g

    @bp.route("/dashboard")
    @host_required
    def dashboard():
        host = g.current_host
        ...
"""

from functools import wraps
from flask import g
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.host import Host
from app.utils.response import error_response


def host_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        host_id = get_jwt_identity()
        host = Host.query.get(int(host_id))

        if host is None:
            return error_response("Host account not found.", status=404)

        if host.status != "active":
            message = (
                "Your account has been suspended. Contact support."
                if host.status == "suspended"
                else "Your account is still pending admin approval. "
                     "Please wait for an administrator to review your application."
            )
            return error_response(message, status=403)

        g.current_host = host
        return fn(*args, **kwargs)

    return wrapper
