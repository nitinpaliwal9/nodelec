# auth.py

import hashlib
import secrets
import datetime

from fastapi import Header, HTTPException, Depends
from sqlalchemy.orm import Session

from database import get_db
import models

# ==========================================================
# KEY FORMAT
# ==========================================================
# nk_live_<43 url-safe base64 chars from secrets.token_urlsafe(32)>
# The "nk_live_" prefix makes a leaked key recognizable in logs/grep
# the same way Stripe/GitHub-style keys are -- it carries no secret
# information itself, the token after it does.

KEY_PREFIX = "nk_live_"
PREFIX_DISPLAY_CHARS = 14  # how much of the raw key we keep around for display


def generate_api_key() -> str:
    return KEY_PREFIX + secrets.token_urlsafe(32)


def hash_api_key(raw_key: str) -> str:
    # API keys are already high-entropy random tokens (not low-entropy
    # human passwords), so a fast cryptographic hash is the right tool
    # here -- not bcrypt/argon2, which are deliberately slow to resist
    # brute-forcing *guessable* secrets. There's nothing to guess here.
    return hashlib.sha256(raw_key.encode("utf-8")).hexdigest()


# ==========================================================
# FASTAPI DEPENDENCY
# ==========================================================

def get_current_organization(
    authorization: str = Header(default=None),
    db: Session = Depends(get_db)
) -> models.Organization:

    if not authorization or not authorization.startswith("Bearer "):

        raise HTTPException(
            status_code=401,
            detail=(
                "Missing or malformed Authorization header. "
                "Expected: 'Authorization: Bearer <api_key>'"
            )
        )

    raw_key = authorization.removeprefix("Bearer ").strip()

    if not raw_key:

        raise HTTPException(
            status_code=401,
            detail="Empty API key"
        )

    key_hash = hash_api_key(raw_key)

    api_key = (
        db.query(models.ApiKey)
        .filter(models.ApiKey.key_hash == key_hash)
        .first()
    )

    if not api_key or api_key.revoked_at is not None:

        raise HTTPException(
            status_code=401,
            detail="Invalid or revoked API key"
        )

    api_key.last_used_at = datetime.datetime.now(datetime.timezone.utc)
    db.commit()

    return api_key.organization
