# CampusConnect.ai

An AI-powered campus networking platform that helps students discover project partners, teammates and collaborators based on shared interests and complementary skills.

**Live demo:** https://campusconnect-three-rho.vercel.app
**API docs:** https://campusconnect-zaxg.onrender.com/docs

> The backend runs on a free tier and sleeps when idle. The first request can take 30-60 seconds to wake it up.

---

## Features

- **Student profiles:** create a profile with course, year, bio, skills, interests, goals and what you're looking for
- **Discover and search:** browse the campus community and filter by skills and interests
- **AI recommendations ("For you"):** interest-based ML recommender that suggests compatible students
- **TF-IDF + cosine-similarity recommendations and teammate suggestions
- **Groq-powered campus assistant
- **IILM-only account registration (`@iilm.edu`)
- **Team builder:** find teammates who bring a missing skill or a fresh perspective
- **Campus AI chatbot:** assistant powered by Groq LLMs
- **Secure authentication:** JWT-based login with hashed passwords
- **Email verification:** one-time passcode (OTP) sent on sign-up, with expiry and attempt limits

## Requirements
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+ (recommended for this setup)

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite |
| Backend | FastAPI, SQLAlchemy, Pydantic |
| Database | PostgreSQL (Neon) |
| ML / AI | Interest-based recommender, Groq API |
| Auth | JWT, hashed passwords, email OTP |
| Hosting | Vercel (frontend), Render (backend), Neon (database) |

## Architecture

```
React (Vercel)  ──HTTPS──>  FastAPI (Render)  ──SSL──>  PostgreSQL (Neon)
                                  │
                                  └──> Groq API (chatbot)
```

## Project structure

```
CampusConnect.ai/
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI app, CORS, routes
│   │   ├── auth.py            # JWT and password helpers
│   │   ├── auth_routes.py     # signup, login, email verification
│   │   ├── auth_schemas.py
│   │   ├── database.py        # SQLAlchemy engine and session
│   │   ├── models.py          # users, students, email_verifications
│   │   ├── schemas.py
│   │   ├── recommender.py     # interest-based matching
│   │   └── seed.py            # sample data
│   └── requirements.txt
├── frontend/                  # React + Vite app
└── README.md
```

## Run locally

### 1. Clone

```bash
git clone https://github.com/tusharraggarwal/campusconnect.git
cd campusconnect
```

### 2. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS / Linux
pip install -r requirements.txt
```

Create `backend/.env`:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require
SECRET_KEY=a-long-random-string
GROQ_API_KEY=your-groq-key
# plus the email / SMTP settings your app uses for OTP
```

Start the server:

```bash
uvicorn app.main:app --reload
```

API docs: http://127.0.0.1:8000/docs

### 3. Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://127.0.0.1:8000
```

```bash
npm run dev
```

## Deployment

| Service | Setting |
|---|---|
| Render (backend) | Root directory `backend`, build `pip install -r requirements.txt`, start `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Render env vars | `DATABASE_URL`, `SECRET_KEY`, `GROQ_API_KEY`, email settings |
| Vercel (frontend) | Root directory `frontend`, env var `VITE_API_URL` set to the Render URL (no trailing slash) |
| CORS | Add the Vercel URL to the allowed origins in `backend/app/main.py` |

## Security notes

- Secrets live in environment variables and are never committed (`.env` is in `.gitignore`)
- Passwords are stored as hashes
- OTP codes are stored hashed, expire, and limit attempts

## Roadmap

- Alembic database migrations
- Automated tests and CI with GitHub Actions
- Rate limiting on login and OTP endpoints
- Team formation and messaging between students

## Author

**Tushar**, B.Tech CSE (AI/ML), IILM University, Greater Noida
GitHub: [tusharraggarwal](https://github.com/tusharraggarwal)