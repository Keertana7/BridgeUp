import importlib
import os
import sys
import time
import unittest
from unittest.mock import patch

import jwt
from cryptography.hazmat.primitives.asymmetric import ec
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials


BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)


class SupabaseAudienceTests(unittest.TestCase):
    def setUp(self):
        self.environment = patch.dict(
            os.environ,
            {"SUPABASE_URL": "https://auth-test.supabase.co"},
        )
        self.environment.start()
        self.addCleanup(self.environment.stop)

        sys.modules.pop("app.auth", None)
        self.auth = importlib.import_module("app.auth")
        self.addCleanup(lambda: sys.modules.pop("app.auth", None))

        self.private_key = ec.generate_private_key(ec.SECP256R1())
        self.public_key = self.private_key.public_key()
        self.public_key_patcher = patch.object(
            self.auth,
            "_get_public_key",
            return_value=self.public_key,
        )
        self.public_key_patcher.start()
        self.addCleanup(self.public_key_patcher.stop)

    def make_credentials(self, audience):
        token = jwt.encode(
            {
                "sub": "synthetic-user",
                "iss": self.auth.EXPECTED_ISSUER,
                "aud": audience,
                "exp": int(time.time()) + 60,
            },
            self.private_key,
            algorithm="ES256",
            headers={"kid": "synthetic-key"},
        )
        return HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

    def test_authenticated_audience_is_accepted(self):
        payload = self.auth.get_current_user(
            self.make_credentials("authenticated")
        )

        self.assertEqual(payload["sub"], "synthetic-user")
        self.assertEqual(payload["aud"], "authenticated")

    def test_incorrect_audience_is_rejected(self):
        with self.assertRaises(HTTPException) as error:
            self.auth.get_current_user(self.make_credentials("incorrect"))

        self.assertEqual(error.exception.status_code, 401)
        self.assertIn("Audience doesn't match", error.exception.detail)


if __name__ == "__main__":
    unittest.main()
