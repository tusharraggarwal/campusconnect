from sqlalchemy.orm import Session
from .models import Student

DEMO_STUDENTS = [
    dict(name="Aarav Sharma", course="B.Tech CSE", year="2nd Year",
         bio="Building practical AI products and exploring computer vision.",
         skills=["Python", "Machine Learning", "PyTorch", "OpenCV"],
         interests=["AI", "Hackathons", "Badminton"], goals=["AI healthcare project"],
         looking_for="Frontend developer and project collaborators",
         avatar="https://i.pravatar.cc/160?img=12"),
    dict(name="Meera Kapoor", course="B.Tech IT", year="2nd Year",
         bio="Frontend developer who enjoys turning ideas into clean products.",
         skills=["React", "JavaScript", "CSS", "Figma"],
         interests=["Startups", "Design", "Hackathons"], goals=["Build a campus startup"],
         looking_for="AI/ML teammate",
         avatar="https://i.pravatar.cc/160?img=47"),
    dict(name="Kabir Verma", course="B.Tech CSE", year="3rd Year",
         bio="Backend developer interested in scalable APIs and cloud systems.",
         skills=["Python", "FastAPI", "PostgreSQL", "Docker"],
         interests=["Open Source", "Cloud", "AI"], goals=["Build developer tools"],
         looking_for="ML engineer for a side project",
         avatar="https://i.pravatar.cc/160?img=14"),
    dict(name="Ananya Singh", course="B.Tech CSE", year="1st Year",
         bio="Learning data science and loves solving real-world problems.",
         skills=["Python", "SQL", "Pandas", "Statistics"],
         interests=["Data Science", "Reading", "Badminton"], goals=["Data science internship"],
         looking_for="Study group and mentors",
         avatar="https://i.pravatar.cc/160?img=44"),
    dict(name="Rohan Malhotra", course="B.Des", year="2nd Year",
         bio="Product designer focused on accessible and useful digital experiences.",
         skills=["UI/UX", "Figma", "Prototyping", "User Research"],
         interests=["Product Design", "Startups", "Photography"], goals=["Launch a useful app"],
         looking_for="Developers with product ideas",
         avatar="https://i.pravatar.cc/160?img=13"),
    dict(name="Ishita Rao", course="B.Tech CSE", year="3rd Year",
         bio="NLP enthusiast experimenting with LLM applications and RAG.",
         skills=["Python", "NLP", "Transformers", "LangChain"],
         interests=["Generative AI", "Research", "Open Source"], goals=["Publish an AI project"],
         looking_for="Full-stack collaborator",
         avatar="https://i.pravatar.cc/160?img=49"),
]


def seed_students(db: Session):
    if db.query(Student).count() == 0:
        db.add_all([Student(**item) for item in DEMO_STUDENTS])
        db.commit()
