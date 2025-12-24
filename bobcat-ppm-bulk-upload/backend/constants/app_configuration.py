from typing import Optional
from pydantic import Field, HttpUrl
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application configuration settings loaded from environment variables"""

    # Cache Configuration
    cache_ttl_seconds: int

    # Proxy Configuration
    default_proxy_url: Optional[HttpUrl] = None
    default_timeout: float
    max_timeout: float
    verify_ssl: bool

    # Authentication Configuration
    login_token: str
    app_reload: bool
    log_level: str

    # Postgres Database
    postgres_uri: str

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }

# Singleton instance
settings = Settings()