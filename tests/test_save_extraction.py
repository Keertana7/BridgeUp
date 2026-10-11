import importlib
import os
import sys
import types
import unittest

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
INGESTION_DIR = os.path.join(PROJECT_ROOT, "ingestion")
if INGESTION_DIR not in sys.path:
    sys.path.insert(0, INGESTION_DIR)


class FakeTableQuery:
    def __init__(self, rows):
        self.rows = rows
        self.operation = "select"
        self.fields = []
        self.experience_id = None
        self.insert_rows = []

    def select(self, fields):
        self.operation = "select"
        self.fields = fields.split(",")
        return self

    def eq(self, key, value):
        if key == "experience_id":
            self.experience_id = value
        return self

    def delete(self):
        self.operation = "delete"
        return self

    def insert(self, rows):
        self.operation = "insert"
        self.insert_rows = rows
        return self

    def execute(self):
        if self.operation == "select":
            data = [
                {field: row.get(field) for field in self.fields}
                for row in self.rows
                if row.get("experience_id") == self.experience_id
            ]
            return types.SimpleNamespace(data=data)

        if self.operation == "delete":
            self.rows[:] = [
                row
                for row in self.rows
                if row.get("experience_id") != self.experience_id
            ]
            return types.SimpleNamespace(data=[])

        self.rows.extend(self.insert_rows)
        return types.SimpleNamespace(data=self.insert_rows)


class FakeSupabase:
    def __init__(self):
        self.tables = {"questions": [], "advice": []}

    def table(self, name):
        return FakeTableQuery(self.tables[name])


class SaveExtractionTests(unittest.TestCase):
    def setUp(self):
        fake_supabase_client = types.ModuleType("supabase_client")
        fake_supabase_client.supabase = FakeSupabase()
        sys.modules["supabase_client"] = fake_supabase_client
        sys.modules.pop("save_extraction", None)

        self.save_extraction_module = importlib.import_module("save_extraction")
        self.supabase = fake_supabase_client.supabase
        self.result = {
            "questions": [
                {
                    "question": "Explain a hash map.",
                    "category": "Core",
                    "subcategory": "Data structures",
                    "source_section": "Technical",
                    "difficulty": "Medium",
                }
            ],
            "advice": [{"type": "preparation", "content": "Practice daily."}],
        }

    def test_repeated_save_does_not_duplicate_questions_or_advice(self):
        first = self.save_extraction_module.save_extraction("exp-1", self.result)
        question_row = self.supabase.tables["questions"][0]
        advice_row = self.supabase.tables["advice"][0]
        second = self.save_extraction_module.save_extraction("exp-1", self.result)

        self.assertEqual(first, {"questions": 1, "advice": 1})
        self.assertEqual(second, {"questions": 0, "advice": 0})
        self.assertEqual(len(self.supabase.tables["questions"]), 1)
        self.assertEqual(len(self.supabase.tables["advice"]), 1)
        self.assertIs(self.supabase.tables["questions"][0], question_row)
        self.assertIs(self.supabase.tables["advice"][0], advice_row)

    def test_default_save_preserves_existing_rows_and_inserts_missing_rows(self):
        self.supabase.tables["questions"].append({
            "experience_id": "exp-1",
            "question": "Explain a hash map.",
            "category": "Core",
            "subcategory": "Data structures",
            "source_section": "Technical",
            "difficulty": "Medium",
        })

        saved = self.save_extraction_module.save_extraction("exp-1", self.result)

        self.assertEqual(saved, {"questions": 0, "advice": 1})
        self.assertEqual(len(self.supabase.tables["questions"]), 1)
        self.assertEqual(len(self.supabase.tables["advice"]), 1)

    def test_reprocess_explicitly_replaces_existing_rows(self):
        self.save_extraction_module.save_extraction("exp-1", self.result)
        changed_result = {
            "questions": [{
                "question": "Explain a binary tree.",
                "category": "DSA",
                "subcategory": "Trees",
                "source_section": "Technical",
                "difficulty": "Medium",
            }],
            "advice": [{"type": "advice", "content": "Explain your reasoning."}],
        }

        saved = self.save_extraction_module.save_extraction(
            "exp-1",
            changed_result,
            reprocess=True,
        )

        self.assertEqual(saved, {"questions": 1, "advice": 1})
        self.assertEqual(len(self.supabase.tables["questions"]), 1)
        self.assertEqual(self.supabase.tables["questions"][0]["question"], "Explain a binary tree.")
        self.assertEqual(len(self.supabase.tables["advice"]), 1)
        self.assertEqual(self.supabase.tables["advice"][0]["content"], "Explain your reasoning.")


if __name__ == "__main__":
    unittest.main()
