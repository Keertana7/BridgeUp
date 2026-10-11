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


class FakeSupabaseTable:
    def __init__(self):
        self.calls = []
        self._filter = None
        self._update_payload = None
        self._order_by = []

    def select(self, *_args, **_kwargs):
        self.calls.append(("select", _args, _kwargs))
        return self

    def is_(self, *_args, **_kwargs):
        self.calls.append(("is_", _args, _kwargs))
        return self

    def eq(self, key, value):
        self.calls.append(("eq", key, value))
        self._filter = (key, value)
        return self

    def order(self, field):
        self.calls.append(("order", field))
        self._order_by.append(field)
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
        self.table_name = "experience_chunks"
        self.table_obj = FakeSupabaseTable()

    def table(self, name):
        self.table_name = name
        return self.table_obj


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


class EmbedChunksTests(unittest.TestCase):
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
        sys.modules.pop("embed_chunks", None)

        self.embed_chunks = importlib.import_module("embed_chunks")
        self.fake_supabase = fake_supabase_client.supabase

    def test_embed_chunk_text_returns_normalized_vector(self):
        embedding = self.embed_chunks.embed_chunk_text(
            "sample chunk",
            client=FakeGenAIClient(api_key="test-key"),
        )

        self.assertEqual(len(embedding), 768)
        self.assertAlmostEqual(float(np.linalg.norm(embedding)), 1.0)

    def test_embed_chunks_for_experience_updates_only_missing_chunks(self):
        chunk = {
            "id": "chunk-1",
            "experience_id": "exp-1",
            "chunk_index": 0,
            "chunk_text": "some text",
        }

        self.fake_supabase.table_obj.set_query_data([chunk])

        with patch.object(self.embed_chunks, "get_client", return_value=FakeGenAIClient(api_key="test-key")):
            with patch.object(self.embed_chunks.time, "sleep", return_value=None):
                count = self.embed_chunks.embed_chunks_for_experience("exp-1")

        self.assertEqual(count, 1)
        self.assertIn(("is_", ("embedding", "null"), {}), self.fake_supabase.table_obj.calls)
        self.assertIn(("eq", "experience_id", "exp-1"), self.fake_supabase.table_obj.calls)
        self.assertEqual(len(self.fake_supabase.table_obj._update_payload["embedding"]), 768)
        self.assertAlmostEqual(np.linalg.norm(self.fake_supabase.table_obj._update_payload["embedding"]), 1.0)


if __name__ == "__main__":
    import numpy as np
    unittest.main()
