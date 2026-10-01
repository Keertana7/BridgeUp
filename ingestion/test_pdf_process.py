from pathlib import Path

from pdf_process import process_pdf
from save_extraction import save_extraction
from supabase_client import supabase


PDF_FOLDER = Path("data/pdfs")


def get_experience_id(filename):
    """
    Find the existing experience row created by pdf_ingest.py.
    """

    result = (
        supabase
        .table("experiences")
        .select("id")
        .eq("source_file", filename)
        .eq("source_type", "pdf")
        .single()
        .execute()
    )

    return result.data["id"]


def main():

    pdf_path = (
        PDF_FOLDER /
        "Applied_Materials_Interview_Report_JahnaviMR-2.pdf"
    )

    print(f"Processing: {pdf_path.name}")

    # -----------------------------------------
    # PDF → Gemini
    # -----------------------------------------

    result = process_pdf(pdf_path)


    print("\n==============================")
    print("QUESTIONS")
    print("==============================")

    for question in result["questions"]:

        print("\nQuestion:", question["question"])
        print("Category:", question["category"])
        print("Subcategory:", question["subcategory"])
        print("Source:", question["source_section"])
        print("Difficulty:", question["difficulty"])


    print("\n==============================")
    print("ADVICE")
    print("==============================")

    for advice in result["advice"]:

        print("\nType:", advice["type"])
        print("Content:", advice["content"])


    # -----------------------------------------
    # Find existing experience
    # -----------------------------------------

    experience_id = get_experience_id(
        pdf_path.name
    )

    print(
        f"\nExperience ID: {experience_id}"
    )


    # -----------------------------------------
    # Save Gemini extraction
    # -----------------------------------------

    save_extraction(
        experience_id,
        result
    )


if __name__ == "__main__":
    main()