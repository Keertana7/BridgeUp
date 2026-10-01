import json
from pathlib import Path

from supabase_client import supabase


EXTRACTED_FOLDER = Path("data/extracted")


# --------------------------------------------------
# FIND EXPERIENCE
# --------------------------------------------------

def get_experience(source_file):
    """Find the Supabase experience matching the JSON file."""

    result = (
        supabase
        .table("experiences")
        .select("id, source_file, extraction_status")
        .eq("source_file", source_file)
        .eq("source_type", "pdf")
        .single()
        .execute()
    )

    return result.data


# --------------------------------------------------
# SAVE QUESTIONS
# --------------------------------------------------

def save_questions(experience_id, questions):

    if not questions:
        return 0

    rows = []

    for question in questions:

        rows.append({
            "experience_id": experience_id,
            "question": question.get("question"),
            "category": question.get("category"),
            "subcategory": question.get("subcategory"),
            "source_section": question.get("source_section"),
            "difficulty": question.get("difficulty")
        })

    (
        supabase
        .table("questions")
        .insert(rows)
        .execute()
    )

    return len(rows)


# --------------------------------------------------
# SAVE ADVICE
# --------------------------------------------------

def save_advice(experience_id, advice):

    if not advice:
        return 0

    rows = []

    for item in advice:

        rows.append({
            "experience_id": experience_id,
            "type": item.get("type"),
            "content": item.get("content")
        })

    (
        supabase
        .table("advice")
        .insert(rows)
        .execute()
    )

    return len(rows)


# --------------------------------------------------
# IMPORT ONE JSON
# --------------------------------------------------

def import_json(json_path):

    print("\n" + "=" * 60)
    print(f"Processing: {json_path.name}")
    print("=" * 60)

    # ----------------------------------------------
    # Read JSON
    # ----------------------------------------------

    with open(
        json_path,
        "r",
        encoding="utf-8"
    ) as f:

        result = json.load(f)

    source_file = result.get("source_file")

    if not source_file:

        print("ERROR: source_file missing from JSON.")

        return


    # ----------------------------------------------
    # Find matching experience
    # ----------------------------------------------

    try:

        experience = get_experience(source_file)

    except Exception as e:

        print(
            f"ERROR: Could not find experience "
            f"for {source_file}"
        )

        print(e)

        return


    experience_id = experience["id"]
    extraction_status = experience["extraction_status"]

    print(f"Experience ID: {experience_id}")
    print(f"Extraction status: {extraction_status}")


    # ----------------------------------------------
    # Already imported?
    # ----------------------------------------------

    if extraction_status == "completed":

        print(
            "SKIPPED: extraction already imported."
        )

        return


    # ----------------------------------------------
    # Get extracted data
    # ----------------------------------------------

    questions = result.get("questions", [])
    advice = result.get("advice", [])


    print(
        f"Questions to import: {len(questions)}"
    )

    print(
        f"Advice items to import: {len(advice)}"
    )


    # ----------------------------------------------
    # Save questions
    # ----------------------------------------------

    question_count = save_questions(
        experience_id,
        questions
    )


    # ----------------------------------------------
    # Save advice
    # ----------------------------------------------

    advice_count = save_advice(
        experience_id,
        advice
    )


    # ----------------------------------------------
    # Mark extraction as completed
    # ----------------------------------------------

    (
        supabase
        .table("experiences")
        .update({
            "extraction_status": "completed"
        })
        .eq("id", experience_id)
        .execute()
    )


    print(
        f"SUCCESS: imported "
        f"{question_count} questions "
        f"and {advice_count} advice items."
    )

    print(
        "Extraction status → completed"
    )


# --------------------------------------------------
# MAIN
# --------------------------------------------------

def main():

    json_files = sorted(
        EXTRACTED_FOLDER.glob("*.json")
    )

    print(
        f"JSON files found: {len(json_files)}"
    )

    for json_path in json_files:

        try:

            import_json(json_path)

        except Exception as e:

            print(
                f"\nERROR processing "
                f"{json_path.name}:"
            )

            print(e)


# --------------------------------------------------

if __name__ == "__main__":
    main()