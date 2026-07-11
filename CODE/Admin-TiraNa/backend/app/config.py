from pydantic_settings import BaseSettings
from functools import lru_cache
import os

_base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_env_file = os.path.join(_base_dir, ".env")


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://tira_admin:tira_secret@db:5432/tirana_db"
    SECRET_KEY: str = "change-this-to-a-very-long-random-string"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    ENVIRONMENT: str = "development"
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://localhost:5174,http://localhost:5175"
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASS: str = ""
    SMTP_FROM: str = "noreply@tirana.com"

    PAYMONGO_SECRET_KEY: str = ""
    PAYMONGO_PUBLIC_KEY: str = ""
    PAYMONGO_WEBHOOK_SECRET: str = ""

    INTERNAL_API_KEY: str = "tirana-internal-secret-key"

    HOST_API_BASE_URL: str = "http://host.docker.internal:5001"
    CLIENT_API_BASE_URL: str = "http://host.docker.internal:5000"

    model_config = {
        "env_file": _env_file,
        "env_file_encoding": "utf-8",
        "extra": "ignore"
    }


@lru_cache()
def get_settings() -> Settings:
    return Settings()
