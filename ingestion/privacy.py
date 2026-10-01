import re


def sanitize_text(text):
    """Remove obvious personal information before sending text to an LLM."""

    # Remove email addresses
    text = re.sub(
        r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b',
        '[EMAIL]',
        text
    )

    # Remove phone numbers
    text = re.sub(
        r'(?<!\d)(?:\+91[\s-]?)?[6-9]\d{9}(?!\d)',
        '[PHONE]',
        text
    )

    # Remove common Indian student/registration identifiers
    text = re.sub(
        r'\b(?:USN|SRN|Registration\s*No\.?|Roll\s*No\.?|Student\s*ID)\s*[:\-]?\s*[A-Za-z0-9/-]+',
        '[STUDENT_ID]',
        text,
        flags=re.IGNORECASE
    )

    return text