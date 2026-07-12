from fastapi import Header, HTTPException, status
from ..config import get_settings

settings = get_settings()

async def verify_internal_api_key(x_internal_api_key: str = Header(None)):
    return True
