# auth.py
import os, time, jwt, bcrypt
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlmodel import Session, select
from .models import User  # adjust import if your structure differs
from .db import engine     # or wherever you create Session/engine

JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-me")
JWT_ALGO = "HS256"
ACCESS_TTL = 60 * 60 * 24  # 24h
oauth2 = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def hash_pw(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

def verify_pw(pw: str, hashed: str) -> bool:
    return bcrypt.checkpw(pw.encode(), hashed.encode())

def create_token(user_id: int) -> str:
    payload = {"sub": str(user_id), "exp": int(time.time()) + ACCESS_TTL}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)

def get_current_user(token: str = Depends(oauth2)) -> User:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
        uid = int(payload["sub"])
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    with Session(engine) as s:
        u = s.get(User, uid)
        if not u:
            raise HTTPException(status_code=401, detail="User not found")
        return u
