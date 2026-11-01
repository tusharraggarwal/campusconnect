import hashlib
import os
import secrets
import smtplib
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pwdlib import PasswordHash
from sqlalchemy.orm import Session

from .database import get_db
from .models import User

password_hasher = PasswordHash.recommended()
bearer_scheme = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return password_hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return password_hasher.verify(password, password_hash)


def hash_code(code: str) -> str:
    return hashlib.sha256(code.encode("utf-8")).hexdigest()


def create_access_token(user_id: int) -> str:
    secret = os.getenv("JWT_SECRET_KEY", "")
    if len(secret) < 32:
        raise RuntimeError("JWT_SECRET_KEY must be set to a random value of at least 32 characters.")
    now = datetime.now(timezone.utc)
    payload = {"sub": str(user_id), "iat": now, "exp": now + timedelta(minutes=60)}
    return jwt.encode(payload, secret, algorithm="HS256")


def send_verification_email(recipient: str, code: str) -> None:
    host = os.getenv("SMTP_HOST")
    username = os.getenv("SMTP_USERNAME")
    password = os.getenv("SMTP_PASSWORD")
    sender = os.getenv("SMTP_FROM", username or "")
    port = int(os.getenv("SMTP_PORT", "587"))
    if not all([host, username, password, sender]):
        raise RuntimeError("Email is not configured. Set SMTP_HOST, SMTP_USERNAME, SMTP_PASSWORD and SMTP_FROM in backend/.env.")

    message = EmailMessage()
    message["Subject"] = "Verify your CampusConnect account"
    message["From"] = sender
    message["To"] = recipient
    message.set_content(
        f"Your CampusConnect verification code is {code}. "
        "It expires in 10 minutes. If you did not request this, ignore this email."
    )
    with smtplib.SMTP(host, port, timeout=20) as server:
        server.starttls()
        server.login(username, password)
        server.send_message(message)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    unauthorized = HTTPException(
        status_code=401,
        detail="Please log in to continue.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None:
        raise unauthorized
    try:
        payload = jwt.decode(
            credentials.credentials,
            os.getenv("JWT_SECRET_KEY", ""),
            algorithms=["HS256"],
        )
        user_id = int(payload.get("sub", ""))
    except (jwt.PyJWTError, ValueError, TypeError):
        raise unauthorized
    user = db.get(User, user_id)
    if user is None or not user.is_verified:
        raise unauthorized
    return user
