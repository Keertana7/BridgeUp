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
        self._query_data = []
        self._update_payload = None
        self._update_error = None
        self.calls = []

    def select(self, *args, **kwargs):
        self.calls.append(("select", args, kwargs))
        return self

    def is_(self, *args, **kwargs):
        self.calls.append(("is_", args, kwargs))
        return self

    def eq(self, key, value):
        self.calls.append(("eq", key, value))
        return self

    def update(self, payload):
        self._update_payload = payload
        return self

    def execute(self):
        if self._update_payload is not None:
            if self._update_error is not None:
                raise self._update_error
            return types.SimpleNamespace(data=[{"updated": True}])
        return types.SimpleNamespace(data=self._query_data)


class FakeSupabase:
    def __init__(self):
        self.builder = FakeQueryBuilder()
        self.table_calls = []

    def table(self, name):
        self.table_calls.append(name)
        return self.builder


class FakeGenAIClient:
    def __init__(self):
        self.calls = []
        self.models = types.SimpleNamespace(embed_content=self.embed_content)

    def embed_content(self, model, contents, config):
        self.calls.append((model, contents, config))
        values = [1.0] * 768
        return types.SimpleNamespace(
            embeddings=[types.SimpleNamespace(values=values)]
        )


class EmbedAdviceBatchTests(unittest.TestCase):
    def setUp(self):
        fake_google = types.ModuleType("google")
        fake_google_genai = types.ModuleType("google.genai")
        fake_google_genai.client_calls = []

        def create_client(**_kwargs):
            fake_google_genai.client_calls.append(True)
            return FakeGenAIClient()

        fake_google_genai.Client = create_client
        fake_google.genai = fake_google_genai

        fake_supabase_client = types.ModuleType("supabase_client")
        fake_supabase_client.supabase = FakeSupabase()

        sys.modules["google"] = fake_google
        sys.modules["google.genai"] = fake_google_genai
        sys.modules["supabase_client"] = fake_supabase_client
        sys.modules.pop("embed_advice_batch", None)

        self.embed_advice_batch = importlib.import_module("embed_advice_batch")
        self.fake_supabase = fake_supabase_client.supabase
        self.fake_google_genai = fake_google_genai

    def test_import_does_not_query_supabase_or_create_gemini_client(self):
        self.assertEqual(self.fake_supabase.table_calls, [])
        self.assertEqual(self.fake_google_genai.client_calls, [])

    def test_embed_advice_for_experience_updates_missing_advice(self):
        item = {
            "id": "advice-1",
            "experience_id": "exp-1",
            "type": "preparation",
            "content": "Review data structures.",
        }
        self.fake_supabase.builder._query_data = [item]
        client = FakeGenAIClient()

        with patch.object(self.embed_advice_batch, "get_client", return_value=client):
            with patch.object(self.embed_advice_batch.time, "sleep", return_value=None):
                result = self.embed_advice_batch.embed_advice_for_experience("exp-1")

        self.assertEqual(result["total"], 1)
        self.assertEqual(result["success"], 1)
        self.assertEqual(result["failed"], 0)
        self.assertEqual(result["results"][0]["advice_id"], "advice-1")
        self.assertEqual(result["results"][0]["status"], "success")
        self.assertIn(("is_", ("embedding", "null"), {}), self.fake_supabase.builder.calls)
        self.assertEqual(len(self.fake_supabase.builder._update_payload["embedding"]), 768)
        self.assertAlmostEqual(
            np.linalg.norm(self.fake_supabase.builder._update_payload["embedding"]),
            1.0,
        )
        self.assertEqual(
            client.calls[0],
            (
                "gemini-embedding-001",
                "Review data structures.",
                {
                    "task_type": "RETRIEVAL_DOCUMENT",
                    "output_dimensionality": 768,
                },
            ),
        )
        self.assertIn(("eq", "experience_id", "exp-1"), self.fake_supabase.builder.calls)

    def test_no_missing_advice_returns_empty_result_without_gemini_client(self):
        with patch.object(self.embed_advice_batch, "get_client") as get_client:
            result = self.embed_advice_batch.embed_advice_for_experience("exp-1")

        get_client.assert_not_called()
        self.assertEqual(result, {"total": 0, "success": 0, "failed": 0, "results": []})

    def test_embedding_failure_does_not_stop_remaining_records(self):
        self.fake_supabase.builder._query_data = [
            {"id": "advice-1", "content": "first"},
            {"id": "advice-2", "content": "second"},
        ]
        successful_embedding = np.ones(768, dtype=np.float32)

        with patch.object(
            self.embed_advice_batch,
            "embed_advice_text",
            side_effect=[ValueError("embedding failed"), successful_embedding],
        ) as embed_advice_text:
            with patch.object(self.embed_advice_batch.time, "sleep", return_value=None):
                result = self.embed_advice_batch.embed_advice_for_experience(
                    "exp-1",
                    client=FakeGenAIClient(),
                )

        self.assertEqual(embed_advice_text.call_count, 2)
        self.assertEqual(result["total"], 2)
        self.assertEqual(result["success"], 1)
        self.assertEqual(result["failed"], 1)
        self.assertEqual(result["results"][0]["advice_id"], "advice-1")
        self.assertEqual(result["results"][0]["status"], "failed")
        self.assertEqual(result["results"][0]["error"], "embedding failed")
        self.assertEqual(result["results"][1]["status"], "success")

    def test_supabase_update_failure_is_returned_for_record(self):
        self.fake_supabase.builder._query_data = [
            {"id": "advice-1", "content": "Review data structures."}
        ]
        self.fake_supabase.builder._update_error = RuntimeError("update failed")

        with patch.object(self.embed_advice_batch, "get_client", return_value=FakeGenAIClient()):
            with patch.object(self.embed_advice_batch.time, "sleep", return_value=None):
                result = self.embed_advice_batch.embed_advice_for_experience("exp-1")

        self.assertEqual(result["total"], 1)
        self.assertEqual(result["success"], 0)
        self.assertEqual(result["failed"], 1)
        self.assertEqual(result["results"][0]["advice_id"], "advice-1")
        self.assertEqual(result["results"][0]["status"], "failed")
        self.assertEqual(result["results"][0]["error"], "update failed")


if __name__ == "__main__":
    unittest.main()