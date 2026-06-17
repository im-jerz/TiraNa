import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/admin_airbnb")
    HOST_API_URL = os.getenv("HOST_API_URL", "http://localhost:5000")
    HOST_API_KEY = os.getenv("HOST_API_KEY", "")
    APP_ENV = os.getenv("APP_ENV", "development")
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
