from pathlib import Path
import pymupdf

from llm_extract import extract_questions_and_advice


PDF_FOLDER = Path("data/pdfs")


def extract_pdf_text(pdf_path):

    doc = pymupdf.open(pdf_path)

    text = ""

    for page in doc:
        text += page.get_text()

    doc.close()

    return text


def main():

    # For now, test only ONE PDF
    pdf_path = PDF_FOLDER / "L&T Recruitment Process (Amrutha K).pdf"
    
    print(f"Processing: {pdf_path.name}")

    text = extract_pdf_text(pdf_path)

    print(f"Characters extracted: {len(text)}")

    print("\nSending text to Gemini...")

    result = extract_questions_and_advice(text)

    print("\n==============================")
    print("EXTRACTION RESULT")
    print("==============================")

    print("\nQUESTIONS:")

    for question in result["questions"]:

        print("\nQuestion:", question["question"])
        print("Category:", question["category"])
        print("Subcategory:", question["subcategory"])
        print("Source:", question["source_section"])
        print("Difficulty:", question["difficulty"])

    print("\nADVICE:")

    for advice in result["advice"]:

        print("\nType:", advice["type"])
        print("Content:", advice["content"])


if __name__ == "__main__":
    main()