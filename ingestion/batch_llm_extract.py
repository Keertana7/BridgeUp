import json
from pathlib import Path

import pymupdf

from llm_extract import extract_questions_and_advice


PDF_FOLDER = Path("data/pdfs")
OUTPUT_FOLDER = Path("data/extracted")


def extract_pdf_text(pdf_path):
    """Extract text from a PDF."""

    doc = pymupdf.open(pdf_path)

    text = ""

    for page in doc:
        text += page.get_text()

    doc.close()

    return text


def process_pdf(pdf_path):

    output_path = OUTPUT_FOLDER / f"{pdf_path.stem}.json"

    # Prevent duplicate Gemini calls
    if output_path.exists():

        print(
            f"SKIPPED: already extracted - "
            f"{pdf_path.name}"
        )

        return

    print("\n" + "=" * 60)
    print(f"Processing: {pdf_path.name}")
    print("=" * 60)

    try:

        # -----------------------------
        # 1. Extract PDF text
        # -----------------------------

        text = extract_pdf_text(pdf_path)

        print(
            f"Characters extracted: {len(text)}"
        )

        if not text.strip():

            print(
                "SKIPPED: PDF contains no extractable text"
            )

            return

        # -----------------------------
        # 2. Gemini extraction
        # -----------------------------

        print("Sending text to Gemini...")

        result = extract_questions_and_advice(text)

        # -----------------------------
        # 3. Basic validation
        # -----------------------------

        if not isinstance(result, dict):

            raise ValueError(
                "Gemini result is not a JSON object"
            )

        if "questions" not in result:

            raise ValueError(
                "Missing questions field"
            )

        if "advice" not in result:

            raise ValueError(
                "Missing advice field"
            )

        # -----------------------------
        # 4. Add source information
        # -----------------------------

        output = {
            "source_file": pdf_path.name,
            "questions": result["questions"],
            "advice": result["advice"]
        }

        # -----------------------------
        # 5. Save JSON
        # -----------------------------

        with open(
            output_path,
            "w",
            encoding="utf-8"
        ) as f:

            json.dump(
                output,
                f,
                indent=2,
                ensure_ascii=False
            )

        print(
            f"SUCCESS: saved → {output_path}"
        )

        print(
            f"Questions: {len(result['questions'])}"
        )

        print(
            f"Advice: {len(result['advice'])}"
        )

    except Exception as e:

        print(
            f"ERROR processing {pdf_path.name}"
        )

        print(e)


def main():

    OUTPUT_FOLDER.mkdir(
        parents=True,
        exist_ok=True
    )

    pdf_files = sorted(
        PDF_FOLDER.glob("*.pdf")
    )

    print(
        f"PDFs found: {len(pdf_files)}"
    )

    for pdf_path in pdf_files:

        process_pdf(pdf_path)

    print("\n" + "=" * 60)
    print("BATCH EXTRACTION COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    main()