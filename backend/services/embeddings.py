import os

from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

EMBEDDING_MODEL = os.getenv(
    "GEMINI_EMBEDDING_MODEL",
    "gemini-embedding-001"
)

client = genai.Client(api_key=GEMINI_API_KEY)


def create_embedding(text: str) -> list[float]:

    if not text or not text.strip():
        raise ValueError("Cannot create embedding for empty text")

    result = client.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=text,
        config=types.EmbedContentConfig(
            task_type="RETRIEVAL_DOCUMENT",
            output_dimensionality=768
        )
    )

    return result.embeddings[0].values


def create_query_embedding(text: str) -> list[float]:

    if not text or not text.strip():
        raise ValueError("Cannot create embedding for empty query")

    result = client.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=text,
        config=types.EmbedContentConfig(
            task_type="RETRIEVAL_QUERY",
            output_dimensionality=768
        )
    )

    return result.embeddings[0].values