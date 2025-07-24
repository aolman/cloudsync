import jwt
import bcrypt
from jwt.exceptions import InvalidTokenError
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta, timezone

load_dotenv()

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    pw_bytes = password.encode('utf-8')
    return bcrypt.hashpw(pw_bytes, salt)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password)

def create_token(data: dict, expires_delta: timedelta=None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        minutes = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
        expire = datetime.now(timezone.utc) + timedelta(minutes=minutes)
        
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, os.getenv("JWT_SECRET"), algorithm=os.getenv("ALGORITHM"))

def decode_token(token: str) -> str | None:
    try:
        payload = jwt.decode(token, os.getenv("JWT_SECRET"), algorithms=[os.getenv("ALGORITHM")])
        return payload.get("sub")
    except InvalidTokenError:
        return None