"""
Centralized extension instances.

Extensions are created here without an app, then bound to the Flask
app inside create_app() via init_app(). This avoids circular imports
between models, blueprints, and the app factory.
"""

from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from flask_marshmallow import Marshmallow
from flask_cors import CORS
from flask_mail import Mail

db = SQLAlchemy()
migrate = Migrate()
bcrypt = Bcrypt()
jwt = JWTManager()
ma = Marshmallow()
cors = CORS()
mail = Mail()
