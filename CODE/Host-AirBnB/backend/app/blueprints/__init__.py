"""
Central blueprint registry.

register_blueprints(app) is called once from the app factory
(app/__init__.py). Each feature module registers its own Blueprint
with its own url_prefix — see Section 10 of host_dashboard_design.md.
"""


def register_blueprints(app):
    from app.blueprints.auth import auth_bp

    app.register_blueprint(auth_bp)

    # Other blueprints (properties, availability, bookings, payments,
    # reviews, guests, messages, notifications, support, settings,
    # admin_api) are registered here as they're implemented in
    # later phases — see Section 8 (Implementation Plan).
