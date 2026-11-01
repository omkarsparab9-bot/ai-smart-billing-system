"""
Lightweight authentication and role-based access control.
Uses Python standard library (hashlib, hmac, secrets, base64) to avoid any
Rust or C++ build tools on Windows Python 3.15.
"""
import base64
import json
import time
import hmac
import hashlib
from typing import Optional, Dict, Any
from fastapi import HTTPException, Header, Depends, status
from backend.database import get_db_connection, row_to_dict

SECRET_KEY = "smart_billing_system_jwt_secret_college_project_key_2026"
TOKEN_EXPIRY_SECONDS = 86400 * 7  # 7 days

def create_access_token(user_id: int, username: str, role: str, full_name: str) -> str:
    """Creates a signed session token without requiring external compiled libraries."""
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "user_id": user_id,
        "username": username,
        "role": role,
        "full_name": full_name,
        "exp": int(time.time()) + TOKEN_EXPIRY_SECONDS
    }
    
    header_b64 = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip("=")
    payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")
    
    signature_raw = hmac.new(
        SECRET_KEY.encode(),
        f"{header_b64}.{payload_b64}".encode(),
        hashlib.sha256
    ).digest()
    sig_b64 = base64.urlsafe_b64encode(signature_raw).decode().rstrip("=")
    
    return f"{header_b64}.{payload_b64}.{sig_b64}"

def verify_token(token: str) -> Dict[str, Any]:
    """Verifies HMAC signature and expiration."""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            raise ValueError("Invalid token format")
        
        header_b64, payload_b64, sig_b64 = parts
        
        # Verify signature
        expected_sig = base64.urlsafe_b64encode(
            hmac.new(
                SECRET_KEY.encode(),
                f"{header_b64}.{payload_b64}".encode(),
                hashlib.sha256
            ).digest()
        ).decode().rstrip("=")
        
        if not hmac.compare_digest(sig_b64, expected_sig):
            raise ValueError("Token signature verification failed")
            
        # Decode payload
        rem = len(payload_b64) % 4
        if rem > 0:
            payload_b64 += "=" * (4 - rem)
        payload = json.loads(base64.urlsafe_b64decode(payload_b64).decode())
        
        if payload.get("exp", 0) < time.time():
            raise ValueError("Token expired")
            
        return payload
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid credentials. Please log in again."
        )

def get_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """Dependency to retrieve and validate logged-in user from Authorization header."""
    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization header missing")
    
    token = authorization
    if token.startswith("Bearer "):
        token = token[7:]
    
    payload = verify_token(token)
    
    # Confirm user exists in SQLite
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, full_name, role, phone, created_at FROM users WHERE id = ?", (payload["user_id"],))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account no longer exists")
        
    return row_to_dict(row)

def require_admin(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """Ensures the authenticated user has Administrator role."""
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Administrator privileges required."
        )
    return current_user
