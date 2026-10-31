# CampusConnect AI

A full-stack student networking MVP built with FastAPI, React + Vite, SQLite, scikit-learn and optional Groq/Llama.

## Features
- Create and browse student profiles
- Search by name, skills, interests and bio
- ML recommendations using TF-IDF + cosine similarity
- Teammate suggestions based on complementary skills
- Optional GenAI assistant using Groq-hosted Llama
- Responsive React interface

> MVP note: this starter has no production authentication, messaging system, or privacy controls yet. Use fictional/demo data while developing. Add authentication and authorization before collecting real student information.

## Requirements
- Python 3.10+
- Node.js 18+
- npm

## 1. Run the backend

```bash
cd backend
python -m venv .venv

# Windows PowerShell:
.venv\Scripts\Activate.ps1

# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend: http://127.0.0.1:8000  
Swagger API docs: http://127.0.0.1:8000/docs

The database and demo profiles are created automatically on first run.

## 2. Run the frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173

## 3. Enable the AI assistant (optional)

Create `backend/.env` based on `.env.example`:

```env
GROQ_API_KEY=your_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```

Get an API key from https://console.groq.com/keys, then restart FastAPI.

Without a key, the rest of the app and ML recommendations still work. The assistant returns a helpful setup message.

## Main API endpoints

- `GET /api/health`
- `GET /api/students`
- `POST /api/students`
- `GET /api/students/{student_id}`
- `GET /api/recommendations/{student_id}?limit=6`
- `GET /api/teammates/{student_id}?limit=6`
- `POST /api/assistant`

## ML approach

The recommender combines a student's skills, interests, goals and bio into a text document. A TF-IDF vectorizer converts these documents into numeric vectors, and cosine similarity ranks the most similar students.

The teammate endpoint additionally rewards complementary skill sets. This is a transparent baseline, not a trained predictive model. You can later improve it with sentence-transformer embeddings, feedback data, and a learning-to-rank model.

## Suggested next upgrades
1. Add JWT authentication and university email verification.
2. Add connection requests and messaging.
3. Add PostgreSQL for deployment.
4. Add moderation, reporting and profile visibility settings.
5. Collect opt-in feedback to evaluate recommendation quality.
