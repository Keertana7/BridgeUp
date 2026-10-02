import os
import numpy as np
from dotenv import load_dotenv
from google import genai

from supabase_client import supabase

load_dotenv(override=True)

# Gemini client
client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)

# Get one advice item without an embedding
response = (
    supabase
    .table("advice")
    .select("id, type, content")
    .is_("embedding", "null")
    .limit(1)
    .execute()
)

if not response.data:
    raise Exception("No unembedded advice found.")

item = response.data[0]

print("Advice ID:", item["id"])
print("Type:", item["type"])
print("Content:", item["content"])

# Generate embedding
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

# Normalize
embedding = embedding / np.linalg.norm(embedding)

print("Embedding dimension:", len(embedding))
print("Embedding norm:", np.linalg.norm(embedding))

# Store embedding
update_response = (
    supabase
    .table("advice")
    .update({
        "embedding": embedding.tolist()
    })
    .eq("id", item["id"])
    .execute()
)

print("Embedding stored successfully!")

# Verify
verify_response = (
    supabase
    .table("advice")
    .select("id, embedding")
    .eq("id", item["id"])
    .single()
    .execute()
)

stored_embedding = verify_response.data["embedding"]

if isinstance(stored_embedding, str):
    values = stored_embedding.strip("[]").split(",")
    print("Stored vector length:", len(values))
    print("First 5 stored values:", values[:5])
else:
    print("Stored vector length:", len(stored_embedding))
    print("First 5 stored values:", stored_embedding[:5])