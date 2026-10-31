from sqlalchemy import Integer, String, Text, JSON
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
