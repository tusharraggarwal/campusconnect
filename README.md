# CampusConnect AI

A student networking MVP built with React + Vite, FastAPI, SQLAlchemy, PostgreSQL, scikit-learn and optional Groq/Llama.

## Current features
- Student discovery and profile creation
- PostgreSQL support through `DATABASE_URL`
- TF-IDF + cosine-similarity recommendations and teammate suggestions
- Groq-powered campus assistant
- IILM-only account registration (`@iilm.edu`)
- Email verification, Argon2 password hashing and JWT login
- Protected profile creation and AI assistant endpoints

## Requirements
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+ (recommended for this setup)

## 1. Configure the backend

Open `backend/.env`, copy it to `backend/.env`, then fill in your own values. Do not commit `.env`.

Required settings:

```env
DATABASE_URL=postgresql+psycopg://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/campusconnect
GROQ_API_KEY=your_groq_key
GROQ_MODEL=llama-3.3-70b-versatile
JWT_SECRET_KEY=replace_with_a_random_secret_at_least_32_characters_long
UNIVERSITY_EMAIL_DOMAIN=iilm.edu
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_sending_email@gmail.com
SMTP_PASSWORD=your_email_app_password
SMTP_FROM=your_sending_email@gmail.com
```

For Gmail SMTP, use an app password where supported, not your normal account password. SMTP credentials are only for sending verification messages. Do not put secrets in frontend files or GitHub.

Generate a JWT secret with Python:

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

If your PostgreSQL password contains URL-reserved characters such as `@`, `/`, `:` or `%`, URL-encode those characters in `DATABASE_URL`.

## 2. Install and run the backend (Windows PowerShell)

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API: http://127.0.0.1:8000  
Swagger docs: http://127.0.0.1:8000/docs

The application creates the `users` and `email_verifications` tables automatically. On an existing `students` table, startup adds a nullable `owner_id` column without deleting existing student records.

## 3. Run the frontend

Open a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173

## 4. Authentication flow

1. Open the frontend and choose **Log in** → **Create an account**.
2. Enter your name, an email ending in `@iilm.edu`, and a password of at least 10 characters.
3. Configure SMTP in `backend/.env`; a six-digit verification code is emailed to the address.
4. Enter the code in the frontend. A JWT is issued after successful verification.
5. Log in on later visits using the same email and password.
6. Profile creation and the Campus AI assistant require a verified login.

The access token expires after 60 minutes. Logging out clears it from this browser. This MVP stores the token in localStorage; for a production deployment, move to secure HttpOnly cookies, add rate limiting, account recovery, CSRF protections where applicable, and a formal database migration system.

## Authentication endpoints

- `POST /api/auth/register`
- `POST /api/auth/verify`
- `POST /api/auth/login`
- `POST /api/auth/resend-verification`
- `GET /api/auth/me` (Bearer token required)

Other endpoints:
- `GET /api/health`
- `GET /api/students`
- `POST /api/students` (Bearer token required)
- `GET /api/students/{student_id}`
- `GET /api/recommendations/{student_id}`
- `GET /api/teammates/{student_id}`
- `POST /api/assistant` (Bearer token required)

## Important notes
- Existing demo student profiles remain in the database.
- Existing profiles are not automatically assigned to newly registered users.
- This is a development MVP, not a production-hardened identity system. Use only test accounts until email delivery, authorization, backups and deployment security have been reviewed.
