# user_auth.py
#
# Website user accounts (registration/login) -- separate concern from
# auth.py's ApiKey/Organization auth, which is what the dashboard
# itself uses. A registered User has no dashboard access on their own
# (see models.User's docstring); this module only covers proving
# "this browser is logged in as this person".

import secrets
import datetime

import bcrypt
from fastapi import Header, HTTPException, Depends
from sqlalchemy.orm import Session

from database import get_db
import models

from auth import hash_api_key  # generic sha256 hex digest, despite the name

SESSION_TOKEN_PREFIX = "nksession_"
SESSION_LIFETIME_DAYS = 30


def hash_password(raw_password: str) -> str:
    return bcrypt.hashpw(raw_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(raw_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(raw_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except ValueError:
        # Malformed hash (shouldn't happen for a row we wrote ourselves) --
        # fail closed, not with a 500.
        return False


def create_session(db: Session, user: "models.User") -> str:
    """Creates a session row and returns the raw token, shown once."""

    raw_token = SESSION_TOKEN_PREFIX + secrets.token_urlsafe(32)

    session = models.UserSession(
        user_id=user.id,
        token_hash=hash_api_key(raw_token),
        expires_at=datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=SESSION_LIFETIME_DAYS)
    )

    db.add(session)
    db.commit()

    return raw_token


def get_current_user(
    authorization: str = Header(default=None),
    db: Session = Depends(get_db)
) -> "models.User":

    if not authorization or not authorization.startswith("Bearer "):

        raise HTTPException(
            status_code=401,
            detail="Missing or malformed Authorization header. Expected: 'Authorization: Bearer <session_token>'"
        )

    raw_token = authorization.removeprefix("Bearer ").strip()

    if not raw_token:
        raise HTTPException(status_code=401, detail="Empty session token")

    token_hash = hash_api_key(raw_token)

    session = (
        db.query(models.UserSession)
        .filter(models.UserSession.token_hash == token_hash)
        .first()
    )

    if not session:
        raise HTTPException(status_code=401, detail="Invalid or expired session")

    if session.expires_at < datetime.datetime.now(datetime.timezone.utc):

        db.delete(session)
        db.commit()

        raise HTTPException(status_code=401, detail="Session expired, please sign in again")

    return session.user
