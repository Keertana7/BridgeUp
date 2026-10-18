from supabase_client import supabase


def _insert_missing_rows(table_name, experience_id, rows, fields):
    if not rows:
        return 0

    existing_response = (
        supabase
        .table(table_name)
        .select(",".join(fields))
        .eq("experience_id", experience_id)
        .execute()
    )
    existing_keys = {
        tuple(item.get(field) for field in fields)
        for item in existing_response.data or []
    }

    missing_rows = []
    for row in rows:
        key = tuple(row.get(field) for field in fields)
        if key not in existing_keys:
            missing_rows.append(row)
            existing_keys.add(key)

    if missing_rows:
        supabase.table(table_name).insert(missing_rows).execute()

    return len(missing_rows)


def _save_questions(experience_id, rows):
    if not rows:
        return 0

    table = supabase.table("questions")
    response = (
        table
        .select("id,question,category,subcategory,source_section,difficulty")
        .eq("experience_id", experience_id)
        .execute()
    )
    existing_by_text = {
        item.get("question"): item
        for item in response.data or []
    }
    pending_by_text = {}
    metadata_fields = ("category", "subcategory", "source_section", "difficulty")

    for row in rows:
        question_text = row.get("question")
        existing = existing_by_text.get(question_text)
        if existing is not None:
            updates = {
                field: row[field]
                for field in metadata_fields
                if row.get(field) not in (None, "", "Unknown")
                and row.get(field) != existing.get(field)
            }
            if updates:
                (
                    table
                    .update(updates)
                    .eq("id", existing["id"])
                    .execute()
                )
                existing.update(updates)
            continue

        pending = pending_by_text.get(question_text)
        if pending is not None:
            for field in metadata_fields:
                if row.get(field) not in (None, "", "Unknown"):
                    pending[field] = row[field]
            continue

        pending_by_text[question_text] = row

    missing_rows = list(pending_by_text.values())
    if missing_rows:
        table.insert(missing_rows).execute()

    return len(missing_rows)


def save_extraction(experience_id, result, reprocess=False):
    """
    Save extracted questions and advice without duplicating existing rows.

    Existing questions and advice are deleted only when ``reprocess`` is True.
    """

    questions = result.get("questions", [])
    advice = result.get("advice", [])

    if reprocess:
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


    saved_questions = _save_questions(experience_id, question_rows)


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


    saved_advice = _insert_missing_rows(
        "advice",
        experience_id,
        advice_rows,
        ("type", "content"),
    )


    print(
        f"Saved {saved_questions} questions "
        f"and {saved_advice} advice items."
    )

    return {
        "questions": saved_questions,
        "advice": saved_advice,
    }