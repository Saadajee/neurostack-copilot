# backend/app/core/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "Neurostack Copilot"
    SECRET_KEY: str = "supersecretkey-change-this-in-production!!"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 1 week for dev

    DB_URL: str = "sqlite:///./neurostack.db"

    # Ollama
    OLLAMA_MODEL: str = "gemma3:4b"
    OLLAMA_BASE_URL: str = "http://localhost:11434"

    class Config:
        env_file = ".env"  # optional: will also load from .env file

settings = Settings()