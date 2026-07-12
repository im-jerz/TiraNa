import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models import AdminAccount, OTPVerification, AdminAuditLog
from app.middleware.admin_auth import create_admin_token

def test_invite_admin_success(client, db):
    # Setup admin
    admin = AdminAccount(username="inviter", email="inviter@test.com", is_active=True)
    db.add(admin)
    db.commit()
    token = create_admin_token(admin)

    response = client.post(
        "/admin/management/invite",
        json={"username": "newadmin", "email": "new@test.com"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 201
    assert response.json()["message"] == "Invitation sent successfully"
    
    # Check DB
    new_admin = db.query(AdminAccount).filter(AdminAccount.username == "newadmin").first()
    assert new_admin is not None
    assert new_admin.email == "new@test.com"
    assert new_admin.is_active is False
    assert new_admin.password_hash is None
    
    otp = db.query(OTPVerification).filter(OTPVerification.email == "new@test.com").first()
    assert otp is not None
    assert otp.purpose == "admin_invite"

def test_accept_invite_success(client, db):
    # Setup invite
    admin = AdminAccount(username="invited", email="invited@test.com", is_active=False)
    db.add(admin)
    from datetime import datetime, timedelta
    otp = OTPVerification(
        email="invited@test.com", 
        code="123456", 
        purpose="admin_invite", 
        expires_at=datetime.utcnow() + timedelta(hours=1)
    )
    db.add(otp)
    db.commit()
    
    response = client.post(
        "/admin/auth/accept-invite",
        json={"email": "invited@test.com", "code": "123456", "password": "newpassword123"}
    )
    assert response.status_code == 200
    assert "successfully" in response.json()["message"]
    
    # Check DB
    db.refresh(admin)
    assert admin.is_active is True
    assert admin.password_hash is not None
    assert admin.password_changed is True
    
    db.refresh(otp)
    assert otp.used is True
