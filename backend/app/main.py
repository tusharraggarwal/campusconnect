import os
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from groq import Groq

from .database import Base, engine, get_db
from .models import Student, User
from .schemas import StudentCreate, StudentOut, AssistantRequest
from .recommender import recommend_students
from .seed import seed_students
from .auth import get_current_user
from .auth_routes import router as auth_router
from fastapi.middleware.cors import CORSMiddleware

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

Base.metadata.create_all(bind=engine)
app = FastAPI(
    title="CampusConnect AI API", 
    version="1.0.0"
    ) 
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://campusconnect-three-rho.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)

@app.on_event("startup")
def startup():
    # Add the nullable profile-owner column to existing databases without
    # disturbing existing student rows.
    from sqlalchemy import inspect, text
    inspector = inspect(engine)
    if "students" in inspector.get_table_names():
        columns = {column["name"] for column in inspector.get_columns("students")}
        if "owner_id" not in columns:
            with engine.begin() as connection:
                connection.execute(text("ALTER TABLE students ADD COLUMN owner_id INTEGER"))
    from .database import SessionLocal
    db = SessionLocal()
    try:
        seed_students(db)
    finally:
        db.close()


@app.get("/api/health")
def health():
    return {"status": "ok", "app": "CampusConnect AI"}


@app.get("/api/students", response_model=list[StudentOut])
def list_students(search: str = Query(default=""), db: Session = Depends(get_db)):
    students = db.query(Student).order_by(Student.id.desc()).all()
    if search.strip():
        term = search.lower().strip()
        students = [
            s for s in students
            if term in s.name.lower()
            or term in s.course.lower()
            or term in s.bio.lower()
            or any(term in x.lower() for x in (s.skills or []) + (s.interests or []))
        ]
    return students


@app.post("/api/students", response_model=StudentOut, status_code=201)
def create_student(
    payload: StudentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = db.query(Student).filter(Student.owner_id == current_user.id).first()
    if existing:
        raise HTTPException(status_code=409, detail="You already have a student profile. Profile editing will be added next.")
    student = Student(**payload.model_dump(), owner_id=current_user.id)
    db.add(student)
    db.commit()
    db.refresh(student)
    return student


@app.get("/api/students/{student_id}", response_model=StudentOut)
def get_student(student_id: int, db: Session = Depends(get_db)):
    student = db.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


@app.get("/api/recommendations/{student_id}")
def recommendations(student_id: int, limit: int = 6, db: Session = Depends(get_db)):
    target = db.get(Student, student_id)
    if not target:
        raise HTTPException(status_code=404, detail="Student not found")
    ranked = recommend_students(target, db.query(Student).all(), limit=min(limit, 20))
    return [{"student": StudentOut.model_validate(x["student"]), "score": x["score"], "reason": x["reason"]} for x in ranked]


@app.get("/api/teammates/{student_id}")
def teammates(student_id: int, limit: int = 6, db: Session = Depends(get_db)):
    target = db.get(Student, student_id)
    if not target:
        raise HTTPException(status_code=404, detail="Student not found")
    ranked = recommend_students(target, db.query(Student).all(), limit=min(limit, 20), teammates=True)
    return [{"student": StudentOut.model_validate(x["student"]), "score": x["score"], "reason": x["reason"]} for x in ranked]


@app.post("/api/assistant")
def assistant(
    payload: AssistantRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return {
            "reply": "The AI assistant is not configured yet. Add GROQ_API_KEY to backend/.env. Your CampusConnect profiles and ML recommendations work without it."
        }

    profile_context = ""
    owned_profile = db.query(Student).filter(Student.owner_id == current_user.id).first()
    if owned_profile:
        payload.student_id = owned_profile.id
    if payload.student_id:
        student = db.get(Student, payload.student_id)
        if student:
            profile_context = (
                f"\nCurrent student profile: {student.name}; skills: {', '.join(student.skills or [])}; "
                f"interests: {', '.join(student.interests or [])}; goals: {', '.join(student.goals or [])}."
            )

    try:
        client = Groq(api_key=api_key)
        completion = client.chat.completions.create(
            model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
            messages=[
                {"role": "system", "content": (
                    "You are CampusConnect's friendly campus collaboration assistant. "
                    "Help students discover communities, plan projects, and collaborate. "
                    "Do not invent student profiles or claim to have contacted anyone. "
                    "Keep answers practical and concise." + profile_context
                )},
                {"role": "user", "content": payload.message},
            ],
            temperature=0.6,
            max_tokens=500,
        )
        return {"reply": completion.choices[0].message.content}
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"AI provider error: {str(exc)[:240]}")
