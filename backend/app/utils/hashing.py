# app/utils/hashing.py
from passlib.context import CryptContext

# Pure Argon2 for all NEW passwords
pwd_context = CryptContext(
    schemes=["argon2"],
    deprecated="auto",
    argon2__memory_cost=65536,      # 64 MB
    argon2__time_cost=4,
    argon2__parallelism=4,
)

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        # Fallback for old bcrypt or plain-text passwords in DB
        # Remove this block later when you're 100% migrated
        if hashed_password.startswith("$2b$") or hashed_password.startswith("$2a$"):
            # Old bcrypt hash — let passlib handle it with a temporary context
            from passlib.context import CryptContext
            temp = CryptContext(schemes=["bcrypt"])
            return temp.verify(plain_password, hashed_password)
        else:
            # Last resort: plain text (from early dev)
            return plain_password == hashed_password
