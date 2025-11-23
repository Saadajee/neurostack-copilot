from passlib.context import CryptContext

# 100% pure Argon2 — bcrypt is dead to us
pwd_context = CryptContext(
    schemes=["argon2"],
    deprecated="auto",
    bcrypt__enabled=False,           # disables it even if present
    argon2__default_rounds=12,
)

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)
