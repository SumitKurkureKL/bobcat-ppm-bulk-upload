import base64
import json
import hmac
import hashlib
from typing import Dict, Any

# Known secret
SYMMETRIC_SECRET = "kliLensKLiLensKL"


def _base64url_encode(data: bytes) -> str:
    """
    Encode bytes to base64url string without padding
    """
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def encode_custom_jwt(payload: Dict[str, Any]) -> str:
    """
    Encode payload into a custom JWT using HS256.

    Token format:
        base64url(header).base64url(payload).base64url(signature)
    """

    if not isinstance(payload, dict):
        raise ValueError("JWT payload must be a dictionary")

    # Header (keep alg flexible if external system expects RS256)
    header = {
        "alg": "HS256",
        "typ": "JWT"
    }

    # Serialize header and payload
    header_json = json.dumps(header, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    payload_json = json.dumps(payload, separators=(",", ":"), ensure_ascii=False).encode("utf-8")

    # Base64url encode
    header_b64 = _base64url_encode(header_json)
    payload_b64 = _base64url_encode(payload_json)

    # Create signing message
    message = f"{header_b64}.{payload_b64}".encode("utf-8")

    # Generate signature
    signature = hmac.new(
        SYMMETRIC_SECRET.encode("utf-8"),
        message,
        hashlib.sha256
    ).digest()

    signature_b64 = _base64url_encode(signature)

    # Final token
    token = f"{header_b64}.{payload_b64}.{signature_b64}"
    return token
