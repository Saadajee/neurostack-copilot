# backend/app/core/config.py
from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    APP_NAME: str = "Neurostack Copilot"
    SECRET_KEY: str = "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6A7B8C9D0E1F2"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
    DB_URL: str = "sqlite:///./neurostack.db"

    OLLAMA_MODEL: str = "gemma3:4b"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    HF_MODEL: str = "google/gemma-2-2b-it"

    # This will be overridden by secrets on HF Spaces
    HF_TOKEN: str = ""

    class Config:
        env_file = ".env"

# Instantiate settings first
settings = Settings()

# ────────────────── DETECT HF SPACE & INJECT TOKEN ──────────────────
IS_HF_SPACE = bool(
    os.getenv("HF_SPACE_ID") or
    "hf.co" in os.getenv("HOSTNAME", "") or
    os.getenv("SYSTEMCTL_UNIT")
)

# Pull real token from HF Secrets
real_token = os.getenv("HF_TOKEN", "").strip()

if IS_HF_SPACE:
    print("\n" + "="*80)
    print("HUGGING FACE SPACE DETECTED — SWITCHING TO GEMMA-2-2B-IT")
    print(f"HF_TOKEN loaded from Secrets → {'YES' if real_token else 'NO — ADD IT NOW'}")
    print("MODEL: google/gemma-2-2b-it")
    print("="*80 + "\n")
    
    # THIS IS THE LINE THAT WAS MISSING
    settings.HF_TOKEN = real_token
else:
    print("\n" + "="*80)
    print("LOCAL DEV MODE — USING OLLAMA (localhost:11434)")
    print("="*80 + "\n")

print(f"[HF] Using model={model_id} with HF_TOKEN present: {'YES' if bool(hf_token) else 'NO'}")
