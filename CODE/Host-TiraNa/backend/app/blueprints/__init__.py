"""
Central blueprint registry.

register_blueprints(app) is called once from the app factory
(app/__init__.py). Each feature module registers its own Blueprint
with its own url_prefix — see Section 10 of host_dashboard_design.md.
"""

def register_blueprints(app):
    from app.blueprints.auth import auth_bp
    from app.blueprints.properties import properties_bp
    from app.blueprints.listings import listings_bp
    from app.blueprints.revenue import revenue_bp
    from app.blueprints.reviews import reviews_bp
    from app.blueprints.notifications import notifications_bp
    from app.blueprints.internal import internal_bp
    from app.blueprints.settings import settings_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(properties_bp)
    app.register_blueprint(listings_bp)
    app.register_blueprint(revenue_bp)
    app.register_blueprint(reviews_bp)
    app.register_blueprint(notifications_bp)
    app.register_blueprint(internal_bp)
    app.register_blueprint(settings_bp)
