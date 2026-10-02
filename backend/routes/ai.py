from fastapi import APIRouter, HTTPException

from schemas.ai import (
    GenerateQuestionsRequest,
    GenerateQuestionsResponse,
    RAGRequest
)

from services.database import supabase
from services.gemini import generate_text
from services.rag import answer_with_rag


router = APIRouter(
    prefix="/ai",
    tags=["AI"]
)
@router.post(
    "/generate-questions",
    response_model=GenerateQuestionsResponse
)
def generate_questions(request: GenerateQuestionsRequest):

    try:

        # -----------------------------------------
        # 1. Find company
        # -----------------------------------------

        company_result = (
            supabase
            .table("companies")
            .select("id,name")
            .ilike("name", request.company)
            .limit(1)
            .execute()
        )

        company_data = company_result.data or []

        if not company_data:
            raise HTTPException(
                status_code=404,
                detail="Company not found"
            )

        company_id = company_data[0]["id"]
        company_name = company_data[0]["name"]

        # -----------------------------------------
        # 2. Find experiences for company
        # -----------------------------------------

        experiences_result = (
            supabase
            .table("experiences")
            .select("id")
            .eq("company_id", company_id)
            .limit(50)
            .execute()
        )

        experience_ids = [
            row["id"]
            for row in (experiences_result.data or [])
        ]

        # -----------------------------------------
        # 3. Find real questions
        # -----------------------------------------

        existing_questions = []

        if experience_ids:

            questions_result = (
                supabase
                .table("questions")
                .select(
                    "question,category,subcategory,"
                    "source_section,experience_id"
                )
                .eq("category", request.category)
                .in_("experience_id", experience_ids)
                .limit(30)
                .execute()
            )

            existing_questions = (
                questions_result.data or []
            )

        # -----------------------------------------
        # 4. Build context
        # -----------------------------------------

        if existing_questions:

            question_context = "\n".join(
                [
                    f"- {q['question']}"
                    for q in existing_questions
                ]
            )

        else:

            question_context = (
                "No real questions were found in BridgeUp "
                "for this company and category."
            )

        # -----------------------------------------
        # 5. Gemini
        # -----------------------------------------

        system_instruction = """
You are BridgeUp's interview preparation assistant.

Generate practice questions using the provided BridgeUp
interview experience information.

Rules:

1. Generated questions are practice questions.
2. Never claim generated questions were actually asked.
3. Never invent missing interview experience facts.
4. Do not fabricate source questions.
5. Use existing questions as inspiration.
6. Avoid duplicates.
"""

        prompt = f"""
Company:
{company_name}

Category:
{request.category}

REAL QUESTIONS FROM BRIDGEUP:

{question_context}

Generate exactly {request.count} useful practice questions
for a student preparing for this company.

The questions should be relevant to the category.

Do not add explanations.
Return one question per line.
"""

        response = generate_text(
            prompt=prompt,
            system_instruction=system_instruction,
            temperature=0.7,
            max_output_tokens=1500
        )

        questions = parse_generated_questions(response)

        return {
            "questions": questions[:request.count]
        }

    except HTTPException:
        raise

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Question generation failed: {str(e)}"
        )