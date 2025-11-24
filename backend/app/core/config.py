# backend/app/core/config.py
from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    APP_NAME: str = "Neurostack Copilot"
    SECRET_KEY: str = "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6A7B8C9D0E1F2"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
    DB_URL: str = "sqlite:///./neurostack.db"

    # Local dev (Ollama)
    OLLAMA_MODEL: str = "gemma3:4b"
    OLLAMA_BASE_URL: str = "http://localhost:11434"

    # HF Inference (legacy)
    HF_MODEL: str = "google/gemma-2-2b-it"
    HF_TOKEN: str = ""

    # NEW: Groq Cloud API values
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.1-8b-instant"
    GROQ_API_URL: str = "https://api.groq.com/openai/v1"

    class Config:
        env_file = ".env"

settings = Settings()

# Detect HuggingFace Space
IS_HF_SPACE = bool(
    os.getenv("HF_SPACE_ID") or
    "hf.co" in os.getenv("HOSTNAME", "") or
    os.getenv("SYSTEMCTL_UNIT")
)

# Pull secrets
real_hf = os.getenv("HF_TOKEN", "").strip()
real_groq = os.getenv("GROQ_API_KEY", "").strip()

if IS_HF_SPACE:
    print("\n" + "="*80)
    print("HUGGING FACE SPACE DETECTED — USING GROQ API FOR LLM")
    print(f"GROQ_API_KEY loaded → {'YES' if real_groq else 'NO — ADD IT NOW'}")
    print("="*80 + "\n")

    # Inject secrets
    settings.HF_TOKEN = real_hf
    settings.GROQ_API_KEY = real_groq
    settings.GROQ_MODEL = os.getenv("GROQ_MODEL", settings.GROQ_MODEL)
    settings.GROQ_API_URL = os.getenv("GROQ_API_URL", settings.GROQ_API_URL)

else:
    print("\n" + "="*80)
    print("LOCAL DEV MODE — USING OLLAMA (localhost:11434)")
    print("="*80 + "\n")
