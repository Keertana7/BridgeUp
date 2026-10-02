from fastapi import APIRouter, HTTPException

from schemas.ai import ChatRequest, ChatResponse
from services.gemini import generate_text


router = APIRouter(
    prefix="/chat",
    tags=["Chat"]
)
@router.post(
    "",
    response_model=ChatResponse
)
def talk_to_me(request: ChatRequest):

    try:

        history_text = ""

        for message in request.history[-10:]:

            role = message.get("role", "user")
            content = message.get("content", "")

            history_text += (
                f"{role.upper()}: {content}\n"
            )

        system_instruction = """
You are BridgeUp's Talk to Me assistant.

You are a supportive conversational assistant for students
preparing for placements and interviews.

Your job is to:

- listen
- respond empathetically
- help students organize their thoughts
- reduce unnecessary anxiety
- provide practical study/interview suggestions
- encourage healthy preparation habits

Do not pretend to be a doctor, therapist, or emergency service.

If a student expresses immediate danger or intent to hurt
themselves or someone else, encourage them to contact local
emergency services or a trusted person immediately.
"""

        prompt = f"""
Previous conversation:

{history_text}

Student's latest message:

{request.message}

Respond naturally and supportively.
"""

        response = generate_text(
            prompt=prompt,
            system_instruction=system_instruction,
            temperature=0.8,
            max_output_tokens=700
        )

        return {
            "response": response
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Chat failed: {str(e)}"
        )