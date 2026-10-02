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

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)


# ============================================================
# Fetch questions that don't have embeddings
# ============================================================

response = (
    supabase
    .table("questions")
    .select(
        "id, question"
    )
    .is_("embedding", "null")
    .order("id")
    .execute()
)

questions = response.data or []

print("Questions to embed:", len(questions))


if not questions:
    print("All questions already have embeddings.")
    exit()


# ============================================================
# Counters
# ============================================================

success = 0
failed = 0


# ============================================================
# Embed questions
# ============================================================

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


        # ----------------------------------------------------
        # Generate Gemini embedding
        # ----------------------------------------------------

        result = client.models.embed_content(
            model="gemini-embedding-001",
            contents=item["question"],
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
                f"Unexpected embedding dimension: "
                f"{len(embedding)}"
            )


        # ----------------------------------------------------
        # Normalize vector
        # ----------------------------------------------------

        norm = np.linalg.norm(embedding)

        if norm == 0:
            raise Exception(
                "Embedding has zero norm."
            )

        embedding = embedding / norm


        # ----------------------------------------------------
        # Store embedding in Supabase
        # ----------------------------------------------------

        (
            supabase
            .table("questions")
            .update({
                "embedding": embedding.tolist()
            })
            .eq("id", item["id"])
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


        # Small delay between API calls
        time.sleep(0.2)


    except Exception as e:

        failed += 1

        print("✗ FAILED")
        print("Error:", e)


# ============================================================
# Final result
# ============================================================

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