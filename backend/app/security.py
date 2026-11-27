"""Password hashing and signed login tokens, using only the Python standard library."""
import base64
import hashlib
import hmac
import json
import os
import time

from app.config import SECRET_KEY, TOKEN_TTL_HOURS

_ITERATIONS = 200_000


def hash_password(password: str) -> str:
    """Return 'salt$hash' using PBKDF2-HMAC-SHA256 with a random salt."""
    salt = os.urandom(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, _ITERATIONS)
    return f"{salt.hex()}${digest.hex()}"


def verify_password(password: str, stored: str | None) -> bool:
    """Check a password against a stored 'salt$hash' value in constant time."""
    if not stored or "$" not in stored:
        return False
    salt_hex, digest_hex = stored.split("$", 1)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt_hex), _ITERATIONS)
    return hmac.compare_digest(digest.hex(), digest_hex)


def _sign(payload: bytes) -> str:
    """HMAC-SHA256 signature of the payload, base64url encoded."""
    mac = hmac.new(SECRET_KEY.encode(), payload, hashlib.sha256).digest()
    return base64.urlsafe_b64encode(mac).decode().rstrip("=")


def create_token(user_id: int) -> str:
    """Create a signed token that carries the user id and an expiry time."""
    body = json.dumps({"uid": user_id, "exp": int(time.time()) + TOKEN_TTL_HOURS * 3600}).encode()
    return base64.urlsafe_b64encode(body).decode().rstrip("=") + "." + _sign(body)


def read_token(token: str) -> int | None:
    """Return the user id from a valid, unexpired token, otherwise None."""
    try:
        encoded, signature = token.split(".", 1)
        body = base64.urlsafe_b64decode(encoded + "=" * (-len(encoded) % 4))
        if not hmac.compare_digest(_sign(body), signature):
            return None
        data = json.loads(body)
        return int(data["uid"]) if data["exp"] > time.time() else None
    except (ValueError, KeyError, TypeError):
        return None
