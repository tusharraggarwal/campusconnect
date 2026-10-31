from pydantic import BaseModel, Field, ConfigDict


class StudentCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    course: str = ""
    year: str = ""
    bio: str = ""
    skills: list[str] = []
    interests: list[str] = []
    goals: list[str] = []
    looking_for: str = ""
    avatar: str = ""


class StudentOut(StudentCreate):
    id: int
    model_config = ConfigDict(from_attributes=True)


class AssistantRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    student_id: int | None = None
