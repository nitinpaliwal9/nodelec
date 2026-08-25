# crypto_utils.py
#
# Generic Fernet symmetric encryption for secrets stored at rest
# (currently: WhatsApp system tokens). Same pattern and same tradeoff
# as email_intake/crypto.py (mailbox passwords): a real improvement
# over plaintext, not a substitute for a proper secrets manager/KMS --
# anyone with both the database and CREDENTIAL_ENCRYPTION_KEY can
# still decrypt every stored secret. Kept as a separate key/module
# from the mailbox one so rotating one credential class doesn't force
# rotating the other.

import os

from cryptography.fernet import Fernet, InvalidToken


def _get_fernet() -> Fernet:

    key = os.getenv("CREDENTIAL_ENCRYPTION_KEY")

    if not key:

        raise RuntimeError(
            "CREDENTIAL_ENCRYPTION_KEY is not set. Generate one with:\n"
            "  python -c \"from cryptography.fernet import Fernet; "
            "print(Fernet.generate_key().decode())\"\n"
            "and set it in the environment before storing or reading "
            "integration secrets."
        )

    return Fernet(key.encode("utf-8"))


def encrypt_secret(raw_value: str) -> str:

    return (
        _get_fernet()
        .encrypt(raw_value.encode("utf-8"))
        .decode("utf-8")
    )


def decrypt_secret(encrypted_value: str) -> str:

    try:

        return (
            _get_fernet()
            .decrypt(encrypted_value.encode("utf-8"))
            .decode("utf-8")
        )

    except InvalidToken:

        raise RuntimeError(
            "Could not decrypt stored secret -- either "
            "CREDENTIAL_ENCRYPTION_KEY has changed since it was "
            "stored, or the stored value is corrupt."
        )
