from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import declarative_base
from app.utils.hashing import hash_password, verify_password

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password = Column(String)

    def __init__(self, username, password):
        self.username = username
        self.password = hash_password(password)

    def verify_password(self, password):
        return verify_password(password, self.password)
