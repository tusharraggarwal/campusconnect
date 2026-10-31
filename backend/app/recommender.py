from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def profile_text(student) -> str:
    return " ".join([
        student.bio or "",
        " ".join(student.skills or []),
        " ".join(student.interests or []),
        " ".join(student.goals or []),
        student.looking_for or "",
        student.course or "",
    ])


def recommend_students(target, students, limit=6, teammates=False):
    candidates = [s for s in students if s.id != target.id]
    if not candidates:
        return []

    docs = [profile_text(target)] + [profile_text(s) for s in candidates]
    matrix = TfidfVectorizer(stop_words="english").fit_transform(docs)
    similarities = cosine_similarity(matrix[0:1], matrix[1:]).flatten()

    target_skills = {x.lower() for x in (target.skills or [])}
    ranked = []
    for student, similarity in zip(candidates, similarities):
        score = float(similarity)
        their_skills = {x.lower() for x in (student.skills or [])}
        shared = target_skills & their_skills
        complementary = their_skills - target_skills

        if teammates:
            # Teammates should have some shared context but also bring different skills.
            score = 0.65 * score + 0.35 * min(len(complementary) / 4, 1.0)
            reason = "Brings complementary skills: " + (
                ", ".join(sorted(complementary)[:3]) if complementary else "potential collaboration"
            )
        else:
            reason = "Shared interests/skills: " + (
                ", ".join(sorted(shared)[:3]) if shared else "similar profile themes"
            )

        ranked.append({
            "student": student,
            "score": round(score * 100, 1),
            "reason": reason,
        })

    return sorted(ranked, key=lambda x: x["score"], reverse=True)[:limit]
