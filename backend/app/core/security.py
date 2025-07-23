from passlib.context import CryptContext
import jwt
from jwt.exceptions import InvalidTokenError
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
load_dotenv

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_token(data: dict, expires_delta: timedelta=None) -> str:
    to_encode = data.copy()
    expire = datetime.now(datetime.now.utc) + timedelta(minutes=os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", expires_delta))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, os.getenv("JWT_SECRET"), algorithm=os.getenv("ALGORITHM"))

def decode_token(token: str) -> str | None:
    try:
        payload = jwt.decode(token, os.getenv("JWT_SECRET"), algorithms=[os.getenv("ALGORITHM")])
        return payload.get("sub")
    except InvalidTokenError:
        return None