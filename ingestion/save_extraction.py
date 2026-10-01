from supabase_client import supabase


def save_extraction(experience_id, result):
    """
    Save Gemini-extracted questions and advice
    for an existing experience.
    """

    questions = result.get("questions", [])
    advice = result.get("advice", [])


    # -----------------------------------------
    # Remove previous extraction
    # -----------------------------------------
    # Useful while developing/re-running PDFs.

    supabase.table("questions") \
        .delete() \
        .eq("experience_id", experience_id) \
        .execute()

    supabase.table("advice") \
        .delete() \
        .eq("experience_id", experience_id) \
        .execute()


    # -----------------------------------------
    # QUESTIONS
    # -----------------------------------------

    question_rows = []

    for q in questions:

        question_rows.append({
            "experience_id": experience_id,
            "question": q.get("question", ""),
            "category": q.get("category", ""),
            "subcategory": q.get("subcategory", ""),
            "source_section": q.get("source_section", ""),
            "difficulty": q.get("difficulty", "Unknown")
        })


    if question_rows:

        supabase.table("questions") \
            .insert(question_rows) \
            .execute()


    # -----------------------------------------
    # ADVICE
    # -----------------------------------------

    advice_rows = []

    for item in advice:

        advice_rows.append({
            "experience_id": experience_id,
            "type": item.get("type", ""),
            "content": item.get("content", "")
        })


    if advice_rows:

        supabase.table("advice") \
            .insert(advice_rows) \
            .execute()


    print(
        f"Saved {len(question_rows)} questions "
        f"and {len(advice_rows)} advice items."
    )