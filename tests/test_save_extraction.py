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
        self.update_values = None
        self.filters = {}

    def select(self, fields):
        self.operation = "select"
        self.fields = fields.split(",")
        return self

    def eq(self, key, value):
        if key == "experience_id":
            self.experience_id = value
        self.filters[key] = value
        return self

    def delete(self):
        self.operation = "delete"
        return self

    def insert(self, rows):
        self.operation = "insert"
        self.insert_rows = rows
        return self

    def update(self, values):
        self.operation = "update"
        self.update_values = values
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
                row for row in self.rows
                if row.get("experience_id") != self.experience_id
            ]
            return types.SimpleNamespace(data=[])

        if self.operation == "update":
            updated = []
            for row in self.rows:
                if all(row.get(key) == value for key, value in self.filters.items()):
                    row.update(self.update_values)
                    updated.append(row)
            return types.SimpleNamespace(data=updated)

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

    def test_exact_question_text_with_changed_metadata_updates_existing_row(self):
        existing_question = {
            "id": "question-1",
            "experience_id": "exp-1",
            "question": "Explain a hash map.",
            "category": "Other",
            "subcategory": "",
            "source_section": "Technical Interview",
            "difficulty": "Unknown",
            "embedding": [0.1, 0.2],
        }
        self.supabase.tables["questions"].append(existing_question)
        updated_metadata = {
            "questions": [{
                "question": "Explain a hash map.",
                "category": "DSA",
                "subcategory": "Hashing",
                "source_section": "Technical Interview",
                "difficulty": "Medium",
            }],
            "advice": [],
        }

        first = self.save_extraction_module.save_extraction("exp-1", updated_metadata)
        second = self.save_extraction_module.save_extraction("exp-1", updated_metadata)

        self.assertEqual(first["questions"], 0)
        self.assertEqual(second["questions"], 0)
        self.assertEqual(len(self.supabase.tables["questions"]), 1)
        self.assertIs(self.supabase.tables["questions"][0], existing_question)
        self.assertEqual(existing_question["id"], "question-1")
        self.assertEqual(existing_question["category"], "DSA")
        self.assertEqual(existing_question["subcategory"], "Hashing")
        self.assertEqual(existing_question["difficulty"], "Medium")
        self.assertEqual(existing_question["embedding"], [0.1, 0.2])

    def test_similar_but_different_question_text_is_inserted(self):
        existing_question = {
            "experience_id": "exp-1",
            "question": "Explain a binary tree.",
            "category": "DSA",
            "subcategory": "Trees",
            "source_section": "Technical Interview",
            "difficulty": "Unknown",
        }
        self.supabase.tables["questions"].append(existing_question)
        different_question = {
            "questions": [{
                "question": "Explain binary tree traversal.",
                "category": "DSA",
                "subcategory": "Trees",
                "source_section": "Technical Interview",
                "difficulty": "Unknown",
            }],
            "advice": [],
        }

        saved = self.save_extraction_module.save_extraction("exp-1", different_question)

        self.assertEqual(saved["questions"], 1)
        self.assertEqual(len(self.supabase.tables["questions"]), 2)
        self.assertEqual(
            [row["question"] for row in self.supabase.tables["questions"]],
            ["Explain a binary tree.", "Explain binary tree traversal."],
        )

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