import importlib
import os
import sys
import types
import unittest
from unittest.mock import Mock, patch

from fastapi import HTTPException


BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)


class CompanyResolutionTests(unittest.TestCase):
    def setUp(self):
        fake_auth = types.ModuleType("app.auth")
        fake_auth.get_current_user = Mock()
        fake_database = types.ModuleType("app.database")
        fake_database.supabase = Mock()
        fake_service_database = types.ModuleType("services.database")
        fake_service_database.supabase = Mock()

        modules_patcher = patch.dict(
            sys.modules,
            {
                "app.auth": fake_auth,
                "app.database": fake_database,
                "services.database": fake_service_database,
            },
        )
        modules_patcher.start()
        self.addCleanup(modules_patcher.stop)

        sys.modules.pop("app.routers.companies", None)
        self.route = importlib.import_module("app.routers.companies")
        self.addCleanup(lambda: sys.modules.pop("app.routers.companies", None))
        self.database = fake_service_database.supabase

    @staticmethod
    def lookup_query(rows):
        query = Mock()
        query.execute.return_value.data = rows
        return query

    def test_existing_company_is_reused_after_case_and_space_normalization(self):
        table = Mock()
        table.select.return_value = self.lookup_query(
            [{"id": "company-1", "name": "  HSBC  ", "created_at": "now"}]
        )
        self.database.table.return_value = table

        result = self.route.resolve_company(
            self.route.CompanyCreate(name="hsbc"),
            _user={"sub": "user-1"},
        )

        self.assertEqual(result["id"], "company-1")
        table.insert.assert_not_called()

    def test_new_company_is_inserted_with_trimmed_name(self):
        table = Mock()
        table.select.return_value = self.lookup_query([])
        insert = Mock()
        insert.execute.return_value.data = [
            {"id": "company-2", "name": "NewCo", "created_at": "now"}
        ]
        table.insert.return_value = insert
        self.database.table.return_value = table

        result = self.route.resolve_company(
            self.route.CompanyCreate(name="  NewCo  "),
            _user={"sub": "user-1"},
        )

        self.assertEqual(result["id"], "company-2")
        table.insert.assert_called_once_with({"name": "NewCo"})

    def test_concurrent_normalized_insert_returns_existing_company(self):
        table = Mock()
        table.select.side_effect = [
            self.lookup_query([]),
            self.lookup_query(
                [{"id": "company-3", "name": "NewCo", "created_at": "now"}]
            ),
        ]
        insert = Mock()
        insert.execute.side_effect = RuntimeError("23505 duplicate key")
        table.insert.return_value = insert
        self.database.table.return_value = table

        result = self.route.resolve_company(
            self.route.CompanyCreate(name=" newco "),
            _user={"sub": "user-1"},
        )

        self.assertEqual(result["id"], "company-3")

    def test_company_creation_failure_is_reported(self):
        table = Mock()
        table.select.side_effect = [
            self.lookup_query([]),
            self.lookup_query([]),
        ]
        insert = Mock()
        insert.execute.side_effect = RuntimeError("database unavailable")
        table.insert.return_value = insert
        self.database.table.return_value = table

        with self.assertRaises(HTTPException) as error:
            self.route.resolve_company(
                self.route.CompanyCreate(name="NewCo"),
                _user={"sub": "user-1"},
            )

        self.assertEqual(error.exception.status_code, 500)
        self.assertEqual(error.exception.detail, "Company creation failed.")

    def test_blank_normalized_name_is_rejected(self):
        with self.assertRaises(HTTPException) as error:
            self.route.resolve_company(
                self.route.CompanyCreate(name="   "),
                _user={"sub": "user-1"},
            )

        self.assertEqual(error.exception.status_code, 422)
        self.database.table.assert_not_called()


if __name__ == "__main__":
    unittest.main()
