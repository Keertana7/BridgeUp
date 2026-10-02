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

# Get one question from Supabase
response = (
    supabase
    .table("questions")
    .select("id, question")
    .limit(1)
    .execute()
)

if not response.data:
    raise Exception("No questions found in Supabase.")

question = response.data[0]

print("Question ID:", question["id"])
print("Question:", question["question"])

# Generate embedding
result = client.models.embed_content(
    model="gemini-embedding-001",
    contents=question["question"],
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

# Store embedding in Supabase
update_response = (
    supabase
    .table("questions")
    .update({
        "embedding": embedding.tolist()
    })
    .eq("id", question["id"])
    .execute()
)

print("Embedding stored successfully!")

# Verify
verify_response = (
    supabase
    .table("questions")
    .select("id, question, embedding")
    .eq("id", question["id"])
    .single()
    .execute()
)

stored_embedding = verify_response.data["embedding"]

print("Stored embedding type:", type(stored_embedding))
print("Stored embedding starts with:", stored_embedding[:50])

# Supabase returns pgvector as a string
if isinstance(stored_embedding, str):
    values = stored_embedding.strip("[]").split(",")
    print("Stored vector length:", len(values))
    print("First 5 stored values:", values[:5])
else:
    print("Stored vector length:", len(stored_embedding))
    print("First 5 stored values:", stored_embedding[:5])