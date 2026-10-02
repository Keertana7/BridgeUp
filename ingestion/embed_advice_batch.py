import os
import time
import numpy as np
from dotenv import load_dotenv
from google import genai

from supabase_client import supabase

load_dotenv(override=True)

# ============================================================
# Gemini client
# ============================================================

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)


# ============================================================
# Fetch advice without embeddings
# ============================================================

response = (
    supabase
    .table("advice")
    .select("id, type, content")
    .is_("embedding", "null")
    .execute()
)

items = response.data

print("Advice items to embed:", len(items))

if not items:
    print("All advice items already have embeddings.")
    exit()


# ============================================================
# Embedding
# ============================================================

success = 0
failed = 0

for index, item in enumerate(items, start=1):

    try:

        print("\n" + "=" * 60)
        print(f"Processing {index}/{len(items)}")
        print("ID:", item["id"])
        print("Type:", item["type"])
        print("Content:", item["content"])

        # Generate Gemini embedding
        result = client.models.embed_content(
            model="gemini-embedding-001",
            contents=item["content"],
            config={
                "task_type": "RETRIEVAL_DOCUMENT",
                "output_dimensionality": 768
            }
        )

        embedding = np.array(
            result.embeddings[0].values,
            dtype=np.float32
        )

        # Normalize vector
        embedding = embedding / np.linalg.norm(embedding)

        # Verify dimension
        if len(embedding) != 768:
            raise Exception(
                f"Unexpected embedding dimension: {len(embedding)}"
            )

        # Store embedding in Supabase
        (
            supabase
            .table("advice")
            .update({
                "embedding": embedding.tolist()
            })
            .eq("id", item["id"])
            .execute()
        )

        success += 1

        print("✓ Stored successfully")
        print("Dimension:", len(embedding))
        print("Norm:", np.linalg.norm(embedding))

        # Small delay between API calls
        time.sleep(0.2)

    except Exception as e:

        failed += 1

        print("✗ FAILED")
        print("Error:", e)


# ============================================================
# Final summary
# ============================================================

print("\n" + "=" * 60)
print("ADVICE EMBEDDING COMPLETED")
print("=" * 60)

print("Total processed:", len(items))
print("Successful:", success)
print("Failed:", failed)