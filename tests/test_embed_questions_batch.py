import importlib
import os
import sys
import types
import unittest
from unittest.mock import patch

import numpy as np

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
INGESTION_DIR = os.path.join(PROJECT_ROOT, "ingestion")
if INGESTION_DIR not in sys.path:
    sys.path.insert(0, INGESTION_DIR)


class FakeQueryBuilder:
    def __init__(self):
        self._filter = None
        self._order = None
        self._query_data = []
        self._update_payload = None
        self.calls = []

    def select(self, *_args, **_kwargs):
        return self

    def is_(self, *_args, **_kwargs):
        self.calls.append(("is_", _args, _kwargs))
        return self

    def eq(self, key, value):
        self.calls.append(("eq", key, value))
        self._filter = (key, value)
        return self

    def order(self, field):
        self._order = field
        return self

    def update(self, payload):
        self._update_payload = payload
        return self

    def execute(self):
        if self._update_payload is not None:
            return types.SimpleNamespace(data=[{"updated": True}])
        return types.SimpleNamespace(data=self._query_data)

    def set_query_data(self, data):
        self._query_data = data


class FakeSupabase:
    def __init__(self):
        self.builder = FakeQueryBuilder()

    def table(self, name):
        return self.builder


class FakeEmbeddingsResponse:
    def __init__(self, values):
        self.embeddings = [types.SimpleNamespace(values=values)]


class FakeGenAIClient:
    def __init__(self, api_key=None):
        self.api_key = api_key
        self.models = types.SimpleNamespace(embed_content=self.embed_content)

    def embed_content(self, model, contents, config):
        values = [1.0] * 768
        return FakeEmbeddingsResponse(values)


class EmbedQuestionsBatchTests(unittest.TestCase):
    def setUp(self):
        fake_google = types.ModuleType("google")
        fake_google_genai = types.ModuleType("google.genai")
        fake_google_genai.Client = FakeGenAIClient
        fake_google.genai = fake_google_genai

        fake_supabase_client = types.ModuleType("supabase_client")
        fake_supabase_client.supabase = FakeSupabase()

        sys.modules["google"] = fake_google
        sys.modules["google.genai"] = fake_google_genai
        sys.modules["supabase_client"] = fake_supabase_client
        sys.modules.pop("embed_questions_batch", None)

        self.embed_questions_batch = importlib.import_module("embed_questions_batch")
        self.fake_supabase = fake_supabase_client.supabase

    def test_embed_question_text_returns_normalized_vector(self):
        embedding = self.embed_questions_batch.embed_question_text(
            "sample question",
            client=FakeGenAIClient(api_key="demo"),
        )

        self.assertEqual(len(embedding), 768)
        self.assertAlmostEqual(float(np.linalg.norm(embedding)), 1.0)

    def test_embed_questions_for_experience_updates_only_missing_questions(self):
        question = {
            "id": "question-1",
            "experience_id": "exp-1",
            "question": "What is a binary tree?",
        }
        self.fake_supabase.builder.set_query_data([question])

        with patch.object(self.embed_questions_batch, "get_client", return_value=FakeGenAIClient(api_key="demo")):
            with patch.object(self.embed_questions_batch.time, "sleep", return_value=None):
                result = self.embed_questions_batch.embed_questions_for_experience("exp-1")

        self.assertEqual(result["total"], 1)
        self.assertEqual(result["success"], 1)
        self.assertEqual(result["failed"], 0)
        self.assertIn(("is_", ("embedding", "null"), {}), self.fake_supabase.builder.calls)
        self.assertIn(("eq", "experience_id", "exp-1"), self.fake_supabase.builder.calls)
        self.assertEqual(len(self.fake_supabase.builder._update_payload["embedding"]), 768)
        self.assertAlmostEqual(np.linalg.norm(self.fake_supabase.builder._update_payload["embedding"]), 1.0)

    def test_process_question_embedding_reports_failed_result(self):
        failing_item = {"id": "question-2", "question": "bad question"}

        with patch.object(self.embed_questions_batch, "embed_question_text", side_effect=ValueError("embed failed")):
            result = self.embed_questions_batch.process_question_embedding(failing_item)

        self.assertEqual(result["question_id"], "question-2")
        self.assertEqual(result["status"], "failed")
        self.assertEqual(result["embedding"], None)
        self.assertIn("embed failed", result["error"])


if __name__ == "__main__":
    unittest.main()
