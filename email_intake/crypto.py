# email_intake/crypto.py
#
# Encrypts mailbox passwords at rest with Fernet (symmetric, key from
# an env var) instead of storing them in plaintext. This is a real
# improvement over plaintext, but it is not a substitute for a proper
# secrets manager/KMS -- anyone with both the database and
# MAILBOX_CREDENTIAL_KEY can still decrypt every stored password.

import os

from cryptography.fernet import Fernet, InvalidToken


def _get_fernet() -> Fernet:

    key = os.getenv("MAILBOX_CREDENTIAL_KEY")

    if not key:

        raise RuntimeError(
            "MAILBOX_CREDENTIAL_KEY is not set. Generate one with:\n"
            "  python -c \"from cryptography.fernet import Fernet; "
            "print(Fernet.generate_key().decode())\"\n"
            "and set it in the environment before storing or reading "
            "mailbox credentials."
        )

    return Fernet(key.encode("utf-8"))


def encrypt_password(raw_password: str) -> str:

    return (
        _get_fernet()
        .encrypt(raw_password.encode("utf-8"))
        .decode("utf-8")
    )


def decrypt_password(encrypted_password: str) -> str:

    try:

        return (
            _get_fernet()
            .decrypt(encrypted_password.encode("utf-8"))
            .decode("utf-8")
        )

    except InvalidToken:

        raise RuntimeError(
            "Could not decrypt mailbox password -- either "
            "MAILBOX_CREDENTIAL_KEY has changed since it was stored, "
            "or the stored value is corrupt."
        )
