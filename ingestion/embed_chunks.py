import os
import time
import numpy as np
from dotenv import load_dotenv
from google import genai

from supabase_client import supabase


# ============================================================
# Load environment variables
# ============================================================

load_dotenv(override=True)


# ============================================================
# Gemini client
# ============================================================

def get_client():
    return genai.Client(
        api_key=os.getenv("GEMINI_API_KEY")
    )


# ============================================================
# Reusable embedding helpers
# ============================================================

def embed_chunk_text(chunk_text, client=None):
    """Generate a normalized Gemini embedding for one chunk."""

    if client is None:
        client = get_client()

    result = client.models.embed_content(
        model="gemini-embedding-001",
        contents=chunk_text,
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


def update_chunk_embedding(chunk_id, embedding):
    """Store a chunk embedding in Supabase."""

    (
        supabase
        .table("experience_chunks")
        .update({
            "embedding": embedding.tolist()
        })
        .eq("id", chunk_id)
        .execute()
    )


def fetch_missing_chunks_for_experience(experience_id=None):
    """Return chunks whose embedding is NULL, optionally filtered by experience."""

    query = (
        supabase
        .table("experience_chunks")
        .select(
            "id, experience_id, chunk_index, chunk_text"
        )
        .is_("embedding", "null")
        .order("experience_id")
        .order("chunk_index")
    )

    if experience_id is not None:
        query = query.eq("experience_id", experience_id)

    response = query.execute()

    return response.data or []


def embed_chunks_for_experience(experience_id, client=None):
    """Embed all missing chunks for one experience."""

    if experience_id is None:
        raise ValueError("experience_id is required")

    chunks = fetch_missing_chunks_for_experience(experience_id)

    if not chunks:
        print(f"No missing chunk embeddings for experience {experience_id}.")
        return 0

    if client is None:
        client = get_client()

    success = 0

    for chunk in chunks:
        embedding = embed_chunk_text(chunk["chunk_text"], client=client)
        update_chunk_embedding(chunk["id"], embedding)
        success += 1
        time.sleep(0.2)

    return success


# ============================================================
# Batch execution: fetch all missing chunks
# ============================================================

def main():
    chunks = fetch_missing_chunks_for_experience()

    print("Experience chunks to embed:", len(chunks))

    if not chunks:
        print("All experience chunks already have embeddings.")
        return

    client = get_client()
    success = 0
    failed = 0

    for index, chunk in enumerate(chunks, start=1):

        try:

            print("\n" + "=" * 60)
            print(
                f"Processing {index}/{len(chunks)}"
            )

            print(
                "Chunk ID:",
                chunk["id"]
            )

            print(
                "Experience ID:",
                chunk["experience_id"]
            )

            print(
                "Chunk index:",
                chunk["chunk_index"]
            )

            print(
                "Text:",
                chunk["chunk_text"][:300],
                "..."
            )

            embedding = embed_chunk_text(chunk["chunk_text"], client=client)
            update_chunk_embedding(chunk["id"], embedding)

            success += 1

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
    print("EXPERIENCE CHUNK EMBEDDING COMPLETED")
    print("=" * 60)

    print(
        "Total processed:",
        len(chunks)
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