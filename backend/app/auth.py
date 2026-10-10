import os
import json
import jwt
import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv

load_dotenv()

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

SUPABASE_URL = os.getenv("SUPABASE_URL")

if not SUPABASE_URL:
    raise ValueError(
        "Missing SUPABASE_URL. Please set it in your backend/.env file."
    )

# Derive the JWKS endpoint from the project URL — no hardcoding needed.
JWKS_URL = f"{SUPABASE_URL.rstrip('/')}/auth/v1/.well-known/jwks.json"

# The issuer claim Supabase embeds in every access token.
EXPECTED_ISSUER = f"{SUPABASE_URL.rstrip('/')}/auth/v1"

# ---------------------------------------------------------------------------
# JWKS key cache
# ---------------------------------------------------------------------------
# Populated on the first request and reused for all subsequent ones.
# Maps kid (str) → EC public key object (ready for jwt.decode).
_jwks_cache: dict = {}


def _load_jwks() -> None:
    """
    Fetch the JWKS from Supabase and populate _jwks_cache.
    Called once on the first authenticated request.
    """
    try:
        response = httpx.get(JWKS_URL, timeout=10)
        response.raise_for_status()
        jwks = response.json()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Could not fetch JWKS from Supabase: {str(e)}",
        )

    for key_data in jwks.get("keys", []):
        kid = key_data.get("kid")
        if not kid:
            continue
        try:
            # PyJWT's ECAlgorithm.from_jwk() converts the JWK dict into a
            # cryptography EC public key object that jwt.decode() can use.
            public_key = jwt.algorithms.ECAlgorithm.from_jwk(json.dumps(key_data))
            _jwks_cache[kid] = public_key
        except Exception:
            # Skip any malformed keys rather than crashing entirely.
            continue


def _get_public_key(kid: str):
    """
    Return the cached public key for the given kid.
    If the cache is empty (first request), fetches the JWKS first.
    If the kid is still not found after fetching, raises 401.
    """
    if not _jwks_cache:
        _load_jwks()

    key = _jwks_cache.get(kid)
    if key is None:
        # kid not in cache — could be a key rotation; re-fetch once and retry
        _jwks_cache.clear()
        _load_jwks()
        key = _jwks_cache.get(kid)

    if key is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Unknown signing key id (kid='{kid}'). Token cannot be verified.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return key


# ---------------------------------------------------------------------------
# Bearer scheme
# ---------------------------------------------------------------------------

# HTTPBearer extracts the token from "Authorization: Bearer <token>".
# auto_error=True means FastAPI returns 403 automatically if the header is missing.
bearer_scheme = HTTPBearer(auto_error=True)


# ---------------------------------------------------------------------------
# Dependency
# ---------------------------------------------------------------------------

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    """
    FastAPI dependency — verifies a Supabase ES256 JWT and returns the payload.

    Flow:
      1. Extract the raw token from the Authorization header.
      2. Peek at the JWT header (no verification) to read the kid.
      3. Look up the matching EC public key from the JWKS cache.
      4. Verify the token: ES256 signature + expiry + issuer.
      5. Confirm the sub (user UUID) claim is present.
      6. Return the decoded payload.

    Usage in any route:
        @router.get("/protected")
        def my_route(user = Depends(get_current_user)):
            return {"user_id": user["sub"]}

    Raises HTTP 401 for:
      - Missing or malformed Authorization header (handled by HTTPBearer)
      - Unknown kid
      - Invalid ES256 signature
      - Expired token
      - Wrong issuer
      - Missing sub claim
    """
    token = credentials.credentials  # raw JWT string after "Bearer "

    # Step 1: peek at the header to extract kid — decode_complete not needed,
    # get_unverified_header is safe here as we verify the full token next.
    try:
        header = jwt.get_unverified_header(token)
    except jwt.exceptions.DecodeError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Malformed token header: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

    kid = header.get("kid")
    if not kid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token header is missing the key id (kid) field.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    alg = header.get("alg", "")
    if alg != "ES256":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Unsupported token algorithm '{alg}'. Expected ES256.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Step 2: get the matching public key
    public_key = _get_public_key(kid)

    # Step 3: full verification — signature + expiry + issuer
    try:
        payload = jwt.decode(
            token,
            public_key,
            algorithms=["ES256"],
            options={"verify_exp": True},
            issuer=EXPECTED_ISSUER,
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidIssuerError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token issuer is not trusted.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Step 4: confirm sub claim is present
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is missing the user identifier (sub claim).",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Return the full decoded payload.
    # Useful claims: sub (user UUID), email, role, exp, iat
    return payload
