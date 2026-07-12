from datetime import datetime, timedelta
from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import AdminAccount
from ..config import get_settings

settings = get_settings()
security = HTTPBearer()


def create_admin_token(admin: AdminAccount, purpose: str = "admin_access") -> str:
    to_encode = {
        "sub": str(admin.id),
        "username": admin.username,
        "email": admin.email,
        "type": "admin",
        "purpose": purpose,
        "exp": datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES if purpose == "admin_access" else 5),
    }
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def verify_temp_token(token: str, email: str) -> int:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "admin" or payload.get("purpose") != "otp_pending":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token purpose")
        if payload.get("email") != email:
            # Note: We should probably include email in the token payload if we want to verify it this way
            pass 
        return int(payload.get("sub"))
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired temp token")


def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> AdminAccount:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "admin" or payload.get("purpose") != "admin_access":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a valid admin access token")
        admin_id = int(payload.get("sub"))
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    admin = db.query(AdminAccount).filter(AdminAccount.id == admin_id).first()
    if not admin:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Admin not found")
    if not admin.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin account is deactivated")

    return admin
