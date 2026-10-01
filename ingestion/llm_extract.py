import os
import json
import time
from dotenv import load_dotenv
from google import genai

from privacy import sanitize_text


load_dotenv(override=True)

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError("GEMINI_API_KEY not found in .env")


client = genai.Client(api_key=api_key)


EXTRACTION_PROMPT = """
You are helping build BridgeUp, a placement interview experience platform.

Analyze the interview experience text provided below.

Your task is to extract ONLY information useful for students preparing
for placements.

Return ONLY valid JSON.

The JSON must have exactly this structure:

{
  "questions": [
    {
      "question": "...",
      "category": "...",
      "subcategory": "...",
      "source_section": "...",
      "difficulty": "..."
    }
  ],
  "advice": [
    {
      "type": "...",
      "content": "..."
    }
  ]
}

Allowed question categories:

- DSA
- Core
- Aptitude
- Programming
- Project
- HR
- AI/ML
- Other

Allowed advice types:

- advice
- mistake
- remember
- preparation

Rules:
1. Extract questions that were actually asked or clearly described
   as topics/questions discussed during the interview.

2. If the source describes a topic that was asked about but does not
   provide the exact wording, create a concise normalized question
   that preserves the meaning.

3. Do NOT invent a question or add information that is not supported
   by the source.

4. For example:
   - "They asked about extracurricular activities"
     → "Questions about extracurricular activities"
   - "They asked me to introduce myself"
     → "Tell me about yourself."
   - "They discussed my projects"
     → "Questions about the candidate's projects."

5. Normalized questions must remain faithful to the source.
   Do not add specific technical details, technologies, concepts,
   or question wording that the source does not support.

6. If the text describes a coding problem, convert it into a concise
   question describing what the candidate was asked to solve.

7. Categorize each question using the most appropriate category. Use subcategory when it is clear. If the subcategory is not clear, use an empty string.

8. Difficulty should be:
   - Easy
   - Medium
   - Hard
   - Unknown

9. source_section should describe where the question came from.

10. Extract useful preparation advice separately.

11. Extract mistakes separately.

12. Extract important things the candidate wishes they had known
    separately as "remember".

13. Do NOT extract or reproduce:
    - email addresses
    - phone numbers
    - student IDs
    - personal addresses
    - interviewer names
    - other personally identifying information

14. Do NOT invent advice that is not present in the text.

15. If there are no questions or no advice, return an empty array.

Interview experience text:

"""

MODELS = [
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-flash-latest",
    "gemini-3.1-flash-lite"
]

def generate_with_fallback(prompt):

    for model in MODELS:

        print(f"\nTrying model: {model}")

        for attempt in range(3):

            try:

                response = client.models.generate_content(
                    model=model,
                    contents=prompt,
                    config={
                        "response_mime_type": "application/json"
                    }
                )

                print(f"SUCCESS using {model}")

                return response

            except Exception as e:

                error_message = str(e)

                # -----------------------------------------
                # TEMPORARY ERRORS
                # -----------------------------------------

                temporary_error = (
                    "503" in error_message
                    or "UNAVAILABLE" in error_message
                    or "429" in error_message
                    or "RESOURCE_EXHAUSTED" in error_message
                )

                # -----------------------------------------
                # MODEL NOT AVAILABLE
                # -----------------------------------------

                model_unavailable = (
                    "404" in error_message
                    or "NOT_FOUND" in error_message
                    or "no longer available" in error_message
                )

                # -----------------------------------------
                # MODEL NOT AVAILABLE
                # → immediately try next model
                # -----------------------------------------

                if model_unavailable:

                    print(
                        f"{model} is not available "
                        f"for this API key."
                    )

                    break

                # -----------------------------------------
                # TEMPORARY ERROR
                # → retry same model
                # -----------------------------------------

                if temporary_error:

                    if attempt == 2:

                        print(
                            f"{model} failed after "
                            f"3 attempts."
                        )

                        break

                    wait_time = 2 ** attempt

                    print(
                        f"{model} temporarily unavailable. "
                        f"Retrying in {wait_time} seconds..."
                    )

                    time.sleep(wait_time)

                    continue

                # -----------------------------------------
                # OTHER ERROR
                # → don't hide real problems
                # -----------------------------------------

                raise

    raise RuntimeError(
        "All Gemini models failed after retries."
    )


def extract_questions_and_advice(text):
    """
    Sanitize interview experience text,
    send it to Gemini,
    and return structured JSON.
    """

    # Remove private/personal information first
    text = sanitize_text(text)

    prompt = EXTRACTION_PROMPT + text

    response = generate_with_fallback(prompt)

    raw_text = response.text.strip()

    try:
        result = json.loads(raw_text)

        # Basic validation
        if "questions" not in result:
            raise ValueError("Missing 'questions' field")

        if "advice" not in result:
            raise ValueError("Missing 'advice' field")

        return result

    except json.JSONDecodeError:

        print("\nGemini returned invalid JSON:")
        print(raw_text)

        raise