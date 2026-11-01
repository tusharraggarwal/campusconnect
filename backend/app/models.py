from datetime import datetime

from sqlalchemy import Integer, String, Text, JSON, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from .database import Base


class Student(Base):
    __tablename__ = "students"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    course: Mapped[str] = mapped_column(String(120), default="")
    year: Mapped[str] = mapped_column(String(40), default="")
    bio: Mapped[str] = mapped_column(Text, default="")
    skills: Mapped[list] = mapped_column(JSON, default=list)
    interests: Mapped[list] = mapped_column(JSON, default=list)
    goals: Mapped[list] = mapped_column(JSON, default=list)
    looking_for: Mapped[str] = mapped_column(String(200), default="")
    avatar: Mapped[str] = mapped_column(String(500), default="")
    owner_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True, unique=True)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class EmailVerification(Base):
    __tablename__ = "email_verifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    code_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
