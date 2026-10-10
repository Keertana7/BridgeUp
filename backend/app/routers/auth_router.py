from fastapi import APIRouter, Depends
from app.auth import get_current_user

router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)


@router.get(
    "/me",
    responses={
        200: {"description": "Verified token claims returned successfully"},
        401: {"description": "Missing, expired, or invalid Bearer token"},
    },
)
def get_me(user: dict = Depends(get_current_user)):
    """
    Returns the authenticated user's information extracted from the verified Supabase JWT.

    Requires a valid Supabase access token in the Authorization header:
        Authorization: Bearer <supabase_access_token>

    Returns verified claims from the token:
    - **user_id**: the Supabase user UUID (from the `sub` claim)
    - **email**: the user's email address
    - **role**: the Supabase role (typically `authenticated`)
    - **exp**: token expiry as a Unix timestamp
    - **iat**: token issued-at as a Unix timestamp

    Tokens are verified against the project's ES256 JWKS endpoint.
    Returns 401 if the token is missing, expired, or invalid.
    """
    return {
        "user_id": user.get("sub"),
        "email":   user.get("email"),
        "role":    user.get("role"),
        "exp":     user.get("exp"),
        "iat":     user.get("iat"),
    }
