import os
import time
import numpy as np
from dotenv import load_dotenv
from google import genai

from supabase_client import supabase


# ============================================================
# Configuration
# ============================================================

load_dotenv(override=True)


def get_client():
    return genai.Client(
        api_key=os.getenv("GEMINI_API_KEY")
    )


# ============================================================
# Reusable embedding helpers
# ============================================================

def embed_question_text(question_text, client=None):
    """Generate a normalized Gemini embedding for one question."""

    if client is None:
        client = get_client()

    result = client.models.embed_content(
        model="gemini-embedding-001",
        contents=question_text,
        config={
            "task_type": "RETRIEVAL_DOCUMENT",
            "output_dimensionality": 768
        }
    )

    embedding = np.array(
        result.embeddings[0].values,
        dtype=np.float32
    )

    if len(embedding) != 768:
        raise Exception(
            f"Unexpected embedding dimension: {len(embedding)}"
        )

    norm = np.linalg.norm(embedding)

    if norm == 0:
        raise Exception("Embedding has zero norm.")

    return embedding / norm


def update_question_embedding(question_id, embedding):
    """Store a question embedding in Supabase."""

    (
        supabase
        .table("questions")
        .update({
            "embedding": embedding.tolist()
        })
        .eq("id", question_id)
        .execute()
    )


def process_question_embedding(item, client=None):
    """Process one question and return structured success/failure metadata."""

    question_id = item["id"]
    question_text = item["question"]

    try:
        embedding = embed_question_text(question_text, client=client)
        update_question_embedding(question_id, embedding)

        return {
            "question_id": question_id,
            "status": "success",
            "error": None,
            "embedding": embedding,
        }

    except Exception as exc:  # pragma: no cover - exercised by tests with mocks
        return {
            "question_id": question_id,
            "status": "failed",
            "error": str(exc),
            "embedding": None,
        }


def fetch_missing_questions_for_experience(experience_id=None):
    """Return questions with NULL embeddings, optionally for one experience."""

    query = (
        supabase
        .table("questions")
        .select("id, question")
        .is_("embedding", "null")
        .order("id")
    )

    if experience_id is not None:
        query = query.eq("experience_id", experience_id)

    response = query.execute()

    return response.data or []


def embed_questions_for_experience(experience_id, client=None):
    """Embed all missing questions for one experience and return processing stats.

    Returns a dictionary with:
    - total: number of missing questions checked
    - success: number of successful embeddings
    - failed: number of failed embeddings
    - results: list of per-question result dictionaries
    """

    if experience_id is None:
        raise ValueError("experience_id is required")

    questions = fetch_missing_questions_for_experience(experience_id)

    if not questions:
        print(f"No missing question embeddings for experience {experience_id}.")
        return {
            "total": 0,
            "success": 0,
            "failed": 0,
            "results": [],
        }

    if client is None:
        client = get_client()

    results = []
    success = 0
    failed = 0

    for item in questions:
        result = process_question_embedding(item, client=client)
        results.append(result)

        if result["status"] == "success":
            success += 1
        else:
            failed += 1

        time.sleep(0.2)

    return {
        "total": len(questions),
        "success": success,
        "failed": failed,
        "results": results,
    }


# ============================================================
# Batch execution: fetch all missing questions
# ============================================================

def main():
    questions = fetch_missing_questions_for_experience()

    print("Questions to embed:", len(questions))

    if not questions:
        print("All questions already have embeddings.")
        return

    client = get_client()
    success = 0
    failed = 0

    for index, item in enumerate(questions, start=1):

        try:

            print("\n" + "=" * 60)
            print(
                f"Processing {index}/{len(questions)}"
            )

            print(
                "Question ID:",
                item["id"]
            )

            print(
                "Question:",
                item["question"][:300],
                "..."
            )

            result = process_question_embedding(item, client=client)

            if result["status"] == "success":
                embedding = result["embedding"]
                success += 1
            else:
                print("✗ FAILED")
                print("Error:", result["error"])
                failed += 1
                continue

            print("✓ Stored successfully")
            print(
                "Dimension:",
                len(embedding)
            )
            print(
                "Norm:",
                np.linalg.norm(embedding)
            )

            time.sleep(0.2)

        except Exception as e:

            failed += 1

            print("✗ FAILED")
            print("Error:", e)

    print("\n" + "=" * 60)
    print("QUESTION EMBEDDING COMPLETED")
    print("=" * 60)

    print(
        "Total processed:",
        len(questions)
    )

    print(
        "Successful:",
        success
    )

    print(
        "Failed:",
        failed
    )


if __name__ == "__main__":
    main()