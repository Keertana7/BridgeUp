import re
from supabase_client import supabase


# ============================================================
# Configuration
# ============================================================

TARGET_CHUNK_SIZE = 800
MAX_CHUNK_SIZE = 1200
MIN_CHUNK_SIZE = 100


# ============================================================
# Text cleaning
# ============================================================

def clean_text(text):
    if not text:
        return ""

    text = str(text)

    # Normalize line endings
    text = text.replace("\r\n", "\n")
    text = text.replace("\r", "\n")

    # Normalize spaces/tabs
    text = re.sub(r"[ \t]+", " ", text)

    # Remove excessive blank lines
    text = re.sub(r"\n{3,}", "\n\n", text)

    return text.strip()


# ============================================================
# Sentence splitting
# ============================================================

def split_sentences(text):
    """
    Split text into sentences while trying to preserve
    bullets and numbered content.
    """

    parts = re.split(
        r"(?<=[.!?])\s+(?=[A-Z0-9•])",
        text
    )

    return [
        part.strip()
        for part in parts
        if part.strip()
    ]


# ============================================================
# Section splitting
# ============================================================

def split_into_sections(text):
    """
    Identify paragraphs and common interview sections
    such as Round 1, Technical Interview, HR Interview, etc.
    """

    # Normalize PDF bullet character
    text = text.replace("", "•")

    # Split paragraphs
    paragraphs = re.split(
        r"\n\s*\n+",
        text
    )

    sections = []

    for paragraph in paragraphs:

        paragraph = paragraph.strip()

        if not paragraph:
            continue

        # Detect common interview section boundaries
        paragraph = re.sub(
            r"\s+(?=(Round\s+\d+\s*[-–:]|"
            r"Technical Interview|"
            r"HR Interview|"
            r"Online .*?Assessment))",
            "\n",
            paragraph,
            flags=re.IGNORECASE
        )

        pieces = paragraph.split("\n")

        for piece in pieces:

            piece = piece.strip()

            if piece:
                sections.append(piece)

    return sections


# ============================================================
# Build chunks
# ============================================================

def build_chunks(text):

    text = clean_text(text)

    if not text:
        return []

    sections = split_into_sections(text)

    chunks = []
    current = ""

    for section in sections:

        sentences = split_sentences(section)

        for sentence in sentences:

            # ------------------------------------------------
            # If a single sentence is too large
            # ------------------------------------------------

            if len(sentence) > MAX_CHUNK_SIZE:

                words = sentence.split()
                temp = ""

                for word in words:

                    candidate = (
                        temp + " " + word
                        if temp
                        else word
                    )

                    if len(candidate) > MAX_CHUNK_SIZE:

                        if temp:

                            if current:
                                chunks.append(
                                    current.strip()
                                )
                                current = ""

                            chunks.append(
                                temp.strip()
                            )

                        temp = word

                    else:
                        temp = candidate

                if temp:

                    if current:
                        chunks.append(
                            current.strip()
                        )
                        current = ""

                    chunks.append(
                        temp.strip()
                    )

                continue

            # ------------------------------------------------
            # Normal sentence
            # ------------------------------------------------

            candidate = (
                current + " " + sentence
                if current
                else sentence
            )

            if len(candidate) <= TARGET_CHUNK_SIZE:

                current = candidate

            else:

                if current:
                    chunks.append(
                        current.strip()
                    )

                current = sentence

        # Finish a sufficiently large chunk
        if (
            current
            and len(current) >= TARGET_CHUNK_SIZE
        ):
            chunks.append(
                current.strip()
            )
            current = ""

    # Add remaining text
    if current:
        chunks.append(
            current.strip()
        )

    # ========================================================
    # Merge tiny chunks
    # ========================================================

    merged = []

    for chunk in chunks:

        chunk = chunk.strip()

        if not chunk:
            continue

        if (
            len(chunk) < MIN_CHUNK_SIZE
            and merged
        ):
            merged[-1] = (
                merged[-1]
                + " "
                + chunk
            ).strip()

        else:
            merged.append(chunk)

    # If first chunk is tiny, merge with next
    if (
        len(merged) > 1
        and len(merged[0]) < MIN_CHUNK_SIZE
    ):

        merged[1] = (
            merged[0]
            + " "
            + merged[1]
        ).strip()

        merged.pop(0)

    return merged


# ============================================================
# Fetch experiences
# ============================================================

response = (
    supabase
    .table("experiences")
    .select(
        "id, source_type, content"
    )
    .execute()
)

experiences = response.data or []

print(
    f"Experiences found: {len(experiences)}"
)


# ============================================================
# Create chunks
# ============================================================

total_chunks_created = 0
experiences_skipped = 0

for experience in experiences:

    experience_id = experience["id"]
    source_type = experience.get(
        "source_type"
    )
    content = experience.get(
        "content"
    )

    print("\n" + "=" * 60)
    print(
        f"Experience: {experience_id}"
    )
    print(
        f"Source: {source_type}"
    )

    # ========================================================
    # DUPLICATE PREVENTION
    # ========================================================

    existing_response = (
        supabase
        .table("experience_chunks")
        .select("id")
        .eq(
            "experience_id",
            experience_id
        )
        .limit(1)
        .execute()
    )

    existing_chunks = (
        existing_response.data or []
    )

    if existing_chunks:

        print(
            "Chunks already exist."
        )
        print(
            "Skipping this experience."
        )

        experiences_skipped += 1

        continue

    # ========================================================
    # Validate content
    # ========================================================

    if not content:

        print(
            "No content. Skipping."
        )

        continue

    # ========================================================
    # Generate chunks
    # ========================================================

    chunks = build_chunks(content)

    print(
        f"Generated chunks: {len(chunks)}"
    )

    if not chunks:
        continue

    # ========================================================
    # Prepare rows
    # ========================================================

    rows = []

    for index, chunk in enumerate(chunks):

        rows.append({
            "experience_id": experience_id,
            "document_id": None,
            "chunk_text": chunk,
            "chunk_index": index,
            "embedding": None
        })

    # ========================================================
    # Insert
    # ========================================================

    (
        supabase
        .table("experience_chunks")
        .insert(rows)
        .execute()
    )

    total_chunks_created += len(rows)

    print(
        f"Inserted {len(rows)} chunks."
    )


# ============================================================
# Final result
# ============================================================

print("\n" + "-" * 60)
print("Chunking completed!")
print("-" * 60)

print(
    f"New chunks created: {total_chunks_created}"
)

print(
    f"Experiences skipped: {experiences_skipped}"
)

print("-" * 60)