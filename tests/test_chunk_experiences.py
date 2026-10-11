import os
import sys
import types
import unittest
from unittest.mock import Mock, patch

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
INGESTION_DIR = os.path.join(PROJECT_ROOT, "ingestion")
if INGESTION_DIR not in sys.path:
    sys.path.insert(0, INGESTION_DIR)

fake_supabase = types.ModuleType("supabase_client")
fake_supabase.supabase = types.SimpleNamespace()
sys.modules.setdefault("supabase_client", fake_supabase)

from chunk_experiences import build_chunks, clean_text, split_sentences, split_into_sections
import chunk_experiences


class ChunkExperienceUtilitiesTests(unittest.TestCase):
    def test_clean_text_normalizes_whitespace_and_newlines(self):
        text = "Hello   world\n\n\nNext line\twith tabs\r\n"

        self.assertEqual(
            clean_text(text),
            "Hello world\n\nNext line with tabs",
        )

    def test_split_sentences_preserves_sentence_boundaries(self):
        text = "First sentence. Second sentence! Third sentence?"

        self.assertEqual(
            split_sentences(text),
            [
                "First sentence.",
                "Second sentence!",
                "Third sentence?",
            ],
        )

    def test_split_into_sections_splits_by_paragraphs_and_round_markers(self):
        text = (
            "Round 1: Introduction\n\n"
            "Technical Interview\n"
            "This is the first technical section.\n\n"
            "HR Interview\n"
            "Tell me about yourself."
        )

        sections = split_into_sections(text)

        self.assertIn("Round 1: Introduction", sections)
        self.assertIn("This is the first technical section.", sections)
        self.assertIn("Tell me about yourself.", sections)

    def test_build_chunks_returns_nonempty_chunks_for_short_text(self):
        text = "Alpha beta gamma. Delta epsilon zeta. Eta theta iota."

        chunks = build_chunks(text)

        self.assertTrue(chunks)
        self.assertTrue(all(isinstance(chunk, str) and chunk for chunk in chunks))

    def test_create_chunks_for_experience_inserts_only_missing_indices(self):
        class Query:
            def __init__(self, data=None):
                self.data = data or []
                self.inserted = None

            def select(self, *_args, **_kwargs):
                return self

            def eq(self, *_args, **_kwargs):
                return self

            def limit(self, *_args, **_kwargs):
                return self

            def insert(self, rows):
                self.inserted = rows
                return self

            def execute(self):
                return types.SimpleNamespace(data=self.data)

        experience_query = Query([{"id": "exp-1", "content": "source content"}])
        existing_query = Query([{"chunk_index": 0}])
        insert_query = Query()
        table_queries = iter([experience_query, existing_query, insert_query])

        with patch.object(
            chunk_experiences.supabase,
            "table",
            side_effect=lambda _table: next(table_queries),
            create=True,
        ):
            with patch.object(
                chunk_experiences,
                "build_chunks",
                return_value=["existing chunk", "missing chunk"],
            ):
                created = chunk_experiences.create_chunks_for_experience("exp-1")

        self.assertEqual(created, 1)
        self.assertEqual(len(insert_query.inserted), 1)
        self.assertEqual(insert_query.inserted[0]["chunk_index"], 1)
        self.assertEqual(insert_query.inserted[0]["chunk_text"], "missing chunk")


if __name__ == "__main__":
    unittest.main()
