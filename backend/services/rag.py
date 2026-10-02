from services.database import supabase
from services.embeddings import create_query_embedding
from services.gemini import generate_text


def retrieve_chunks(
    question: str,
    match_count: int = 5,
    experience_id: str | None = None
):

    query_embedding = create_query_embedding(question)

    result = supabase.rpc(
        "match_experience_chunks",
        {
            "query_embedding": query_embedding,
            "match_count": match_count,
            "filter_experience_id": experience_id
        }
    ).execute()

    return result.data or []


def build_context(chunks: list[dict]) -> str:

    if not chunks:
        return "No relevant interview experience was found."

    context_parts = []

    for index, chunk in enumerate(chunks, start=1):

        context_parts.append(
            f"""
SOURCE {index}

Experience ID:
{chunk.get("experience_id")}

Chunk:
{chunk.get("chunk_text")}

Similarity:
{chunk.get("similarity", 0):.4f}
"""
        )

    return "\n".join(context_parts)


def answer_with_rag(
    question: str,
    company: str | None = None,
    experience_id: str | None = None
):

    chunks = retrieve_chunks(
        question=question,
        match_count=5,
        experience_id=experience_id
    )

    context = build_context(chunks)

    company_instruction = ""

    if company:
        company_instruction = f"""
The user is asking specifically about:
Company: {company}

Prefer evidence related to this company.
"""

    system_instruction = """
You are BridgeUp's interview-experience assistant.

Your job is to answer questions using the supplied interview
experience context.

STRICT RULES:

1. Use the supplied context as the source of truth.
2. Do not invent interview questions.
3. Do not invent rounds.
4. Do not invent company-specific facts.
5. Do not claim a question was actually asked unless the context
   explicitly supports that.
6. If the context does not contain enough information, say so.
7. Preserve the meaning of the original interview experiences.
8. You may organize information to make it easier to understand.
9. Clearly distinguish actual reported experiences from general advice.
"""

    prompt = f"""
{company_instruction}

INTERVIEW EXPERIENCE CONTEXT:

{context}

USER QUESTION:

{question}

Answer the user based on the available BridgeUp context.
"""

    answer = generate_text(
        prompt=prompt,
        system_instruction=system_instruction,
        temperature=0.2,
        max_output_tokens=1200
    )

    return {
        "answer": answer,
        "sources": [
            {
                "experience_id": chunk.get("experience_id"),
                "document_id": chunk.get("document_id"),
                "chunk_id": chunk.get("id"),
                "chunk_text": chunk.get("chunk_text"),
                "similarity": chunk.get("similarity")
            }
            for chunk in chunks
        ]
    }