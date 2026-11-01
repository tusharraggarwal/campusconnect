from pydantic import BaseModel, EmailStr, Field, ConfigDict


class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=10, max_length=128)


class VerifyEmailRequest(BaseModel):
    email: EmailStr
    code: str = Field(pattern=r"^\d{6}$")


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class UserOut(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    is_verified: bool
    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
