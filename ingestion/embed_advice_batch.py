import os
import time
import numpy as np
from dotenv import load_dotenv
from google import genai

from supabase_client import supabase

load_dotenv(override=True)


def get_client():
    return genai.Client(
        api_key=os.getenv("GEMINI_API_KEY")
    )


def embed_advice_text(advice_text, client=None):
    """Generate a normalized Gemini embedding for one advice record."""

    if client is None:
        client = get_client()

    result = client.models.embed_content(
        model="gemini-embedding-001",
        contents=advice_text,
        config={
            "task_type": "RETRIEVAL_DOCUMENT",
            "output_dimensionality": 768
        }
    )

    embedding = np.array(
        result.embeddings[0].values,
        dtype=np.float32
    )

    embedding = embedding / np.linalg.norm(embedding)

    if len(embedding) != 768:
        raise Exception(
            f"Unexpected embedding dimension: {len(embedding)}"
        )

    return embedding


def update_advice_embedding(advice_id, embedding):
    """Store an advice embedding in Supabase."""

    (
        supabase
        .table("advice")
        .update({
            "embedding": embedding.tolist()
        })
        .eq("id", advice_id)
        .execute()
    )


def process_advice_embedding(item, client=None):
    """Process one advice record and return its success or failure details."""

    advice_id = None

    try:
        advice_id = item.get("id")
        embedding = embed_advice_text(item["content"], client=client)
        update_advice_embedding(advice_id, embedding)

        return {
            "advice_id": advice_id,
            "status": "success",
            "error": None,
            "embedding": embedding,
        }

    except Exception as exc:
        return {
            "advice_id": advice_id,
            "status": "failed",
            "error": str(exc),
            "embedding": None,
        }


def fetch_missing_advice_for_experience(experience_id=None):
    """Return advice records with NULL embeddings, optionally by experience."""

    query = (
        supabase
        .table("advice")
        .select("id, type, content")
        .is_("embedding", "null")
    )

    if experience_id is not None:
        query = query.eq("experience_id", experience_id)

    response = query.execute()

    return response.data or []


def embed_advice_for_experience(experience_id, client=None):
    """Embed missing advice for one experience and return processing results.

    The returned dictionary contains ``total``, ``success``, and ``failed``
    counts plus ``results``, a list of per-record dictionaries. Each result
    contains ``advice_id``, ``status``, ``error``, and ``embedding``; failures
    include the record ID and error message, and do not stop later records.
    """

    if experience_id is None:
        raise ValueError("experience_id is required")

    items = fetch_missing_advice_for_experience(experience_id)

    if not items:
        print(f"No missing advice embeddings for experience {experience_id}.")
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

    for item in items:
        result = process_advice_embedding(item, client=client)
        results.append(result)

        if result["status"] == "success":
            success += 1
            time.sleep(0.2)
        else:
            failed += 1

    return {
        "total": len(items),
        "success": success,
        "failed": failed,
        "results": results,
    }


def main():
    items = fetch_missing_advice_for_experience()

    print("Advice items to embed:", len(items))

    if not items:
        print("All advice items already have embeddings.")
        return

    client = get_client()
    success = 0
    failed = 0

    for index, item in enumerate(items, start=1):

        try:

            print("\n" + "=" * 60)
            print(f"Processing {index}/{len(items)}")
            print("ID:", item["id"])
            print("Type:", item["type"])
            print("Content:", item["content"])

            result = process_advice_embedding(item, client=client)

            if result["status"] == "failed":
                failed += 1
                print("✗ FAILED")
                print("Error:", result["error"])
                continue

            embedding = result["embedding"]
            success += 1

            print("✓ Stored successfully")
            print("Dimension:", len(embedding))
            print("Norm:", np.linalg.norm(embedding))

            time.sleep(0.2)

        except Exception as exc:

            failed += 1

            print("✗ FAILED")
            print("Error:", exc)

    print("\n" + "=" * 60)
    print("ADVICE EMBEDDING COMPLETED")
    print("=" * 60)

    print("Total processed:", len(items))
    print("Successful:", success)
    print("Failed:", failed)


if __name__ == "__main__":
    main()
