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

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)


# ============================================================
# Fetch chunks without embeddings
# ============================================================

response = (
    supabase
    .table("experience_chunks")
    .select(
        "id, experience_id, chunk_index, chunk_text"
    )
    .is_("embedding", "null")
    .order("experience_id")
    .order("chunk_index")
    .execute()
)

chunks = response.data or []

print("Experience chunks to embed:", len(chunks))


if not chunks:
    print("All experience chunks already have embeddings.")
    exit()


# ============================================================
# Counters
# ============================================================

success = 0
failed = 0


# ============================================================
# Embed each chunk
# ============================================================

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


        # ----------------------------------------------------
        # Generate embedding
        # ----------------------------------------------------

        result = client.models.embed_content(
            model="gemini-embedding-001",
            contents=chunk["chunk_text"],
            config={
                "task_type": "RETRIEVAL_DOCUMENT",
                "output_dimensionality": 768
            }
        )


        embedding = np.array(
            result.embeddings[0].values,
            dtype=np.float32
        )


        # ----------------------------------------------------
        # Validate dimension
        # ----------------------------------------------------

        if len(embedding) != 768:
            raise Exception(
                f"Unexpected embedding dimension: {len(embedding)}"
            )


        # ----------------------------------------------------
        # Normalize vector
        # ----------------------------------------------------

        embedding = (
            embedding /
            np.linalg.norm(embedding)
        )


        # ----------------------------------------------------
        # Store in Supabase
        # ----------------------------------------------------

        (
            supabase
            .table("experience_chunks")
            .update({
                "embedding": embedding.tolist()
            })
            .eq("id", chunk["id"])
            .execute()
        )


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


        # Small delay between requests
        time.sleep(0.2)


    except Exception as e:

        failed += 1

        print("✗ FAILED")
        print("Error:", e)


# ============================================================
# Final result
# ============================================================

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