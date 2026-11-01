import os
import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .auth import (
    create_access_token, get_current_user, hash_code, hash_password,
    send_verification_email, verify_password,
)
from .database import get_db
from .models import EmailVerification, User
from .auth_schemas import (
    LoginRequest, RegisterRequest, TokenResponse, UserOut, VerifyEmailRequest,
)

router = APIRouter(prefix="/api/auth", tags=["authentication"])
ALLOWED_DOMAIN = os.getenv("UNIVERSITY_EMAIL_DOMAIN", "iilm.edu").lower()


def issue_verification(db: Session, user: User) -> None:
    code = f"{secrets.randbelow(1_000_000):06d}"
    record = EmailVerification(
        user_id=user.id,
        code_hash=hash_code(code),
        expires_at=datetime.utcnow() + timedelta(minutes=10),
        attempts=0,
    )
    db.query(EmailVerification).filter(EmailVerification.user_id == user.id).delete()
    db.add(record)
    send_verification_email(user.email, code)


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    email = str(payload.email).strip().lower()
    if email.rsplit("@", 1)[-1] != ALLOWED_DOMAIN:
        raise HTTPException(status_code=400, detail=f"Use your university email ending in @{ALLOWED_DOMAIN}.")
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        if existing.is_verified:
            raise HTTPException(status_code=409, detail="An account with this email already exists. Please log in.")
        latest = db.query(EmailVerification).filter(EmailVerification.user_id == existing.id).first()
        if latest and latest.created_at > datetime.utcnow() - timedelta(seconds=60):
            raise HTTPException(status_code=429, detail="Please wait one minute before requesting another code.")
        try:
            issue_verification(db, existing)
            db.commit()
        except Exception as exc:
            db.rollback()
            raise HTTPException(status_code=503, detail=f"Could not send verification email: {str(exc)[:180]}")
        return {"message": "A new verification code has been sent.", "email": email}

    user = User(
        full_name=payload.full_name.strip(),
        email=email,
        password_hash=hash_password(payload.password),
        is_verified=False,
    )
    db.add(user)
    db.flush()
    try:
        issue_verification(db, user)
        db.commit()
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=503, detail=f"Could not send verification email: {str(exc)[:180]}")
    return {"message": "Verification code sent to your university email.", "email": email}


@router.post("/verify", response_model=TokenResponse)
def verify_email(payload: VerifyEmailRequest, db: Session = Depends(get_db)):
    email = str(payload.email).strip().lower()
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Account not found. Register first.")
    if user.is_verified:
        token = create_access_token(user.id)
        return {"access_token": token, "user": user}
    record = db.query(EmailVerification).filter(EmailVerification.user_id == user.id).first()
    if not record:
        raise HTTPException(status_code=400, detail="No active verification code. Register again to request one.")
    if record.expires_at < datetime.utcnow():
        db.delete(record)
        db.commit()
        raise HTTPException(status_code=400, detail="Verification code expired. Register again to request a new one.")
    if record.attempts >= 5:
        raise HTTPException(status_code=429, detail="Too many incorrect attempts. Request a new code.")
    if not secrets.compare_digest(record.code_hash, hash_code(payload.code)):
        record.attempts += 1
        db.commit()
        raise HTTPException(status_code=400, detail="Incorrect verification code.")
    user.is_verified = True
    db.delete(record)
    db.commit()
    db.refresh(user)
    return {"access_token": create_access_token(user.id), "user": user}


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    email = str(payload.email).strip().lower()
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password.")
    if not user.is_verified:
        raise HTTPException(status_code=403, detail="Verify your university email before logging in.")
    return {"access_token": create_access_token(user.id), "user": user}


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/resend-verification")
def resend_verification(email: str, db: Session = Depends(get_db)):
    normalized = email.strip().lower()
    user = db.query(User).filter(User.email == normalized).first()
    if not user:
        raise HTTPException(status_code=404, detail="Account not found. Register first.")
    if user.is_verified:
        raise HTTPException(status_code=400, detail="This email is already verified.")
    latest = db.query(EmailVerification).filter(EmailVerification.user_id == user.id).first()
    if latest and latest.created_at > datetime.utcnow() - timedelta(seconds=60):
        raise HTTPException(status_code=429, detail="Please wait one minute before requesting another code.")
    try:
        issue_verification(db, user)
        db.commit()
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=503, detail=f"Could not send verification email: {str(exc)[:180]}")
    return {"message": "A new verification code has been sent."}
