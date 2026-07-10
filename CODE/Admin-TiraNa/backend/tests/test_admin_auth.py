import bcrypt
from app.models import AdminAccount, OTPVerification, LoginAttempt
from datetime import datetime, timedelta

def test_admin_login_rate_limiting(client, db):
    # Add 5 failed attempts
    for _ in range(5):
        db.add(LoginAttempt(email="admin@test.com", success=False, attempted_at=datetime.utcnow()))
    db.commit()

    response = client.post("/admin/auth/login", json={"username": "admin@test.com", "password": "wrongpassword"})
    assert response.status_code == 429
    assert "Account locked" in response.json()["detail"]

def test_admin_login_otp_flow(client, db):
    # Create admin
    hashed = bcrypt.hashpw("password123".encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    admin = AdminAccount(username="testadmin", email="admin@test.com", password_hash=hashed, is_active=True)
    db.add(admin)
    db.commit()

    # Step 1: Login
    response = client.post("/admin/auth/login", json={"username": "testadmin", "password": "password123"})
    assert response.status_code == 200
    data = response.json()
    assert data["requires_otp"] is True
    assert "temp_token" in data

    # Check OTP created in DB
    otp = db.query(OTPVerification).filter(OTPVerification.email == "admin@test.com").first()
    assert otp is not None
    
    # Step 2: Verify OTP
    verify_response = client.post("/admin/auth/verify-otp", json={
        "email": "admin@test.com",
        "code": otp.code,
        "temp_token": data["temp_token"]
    })
    assert verify_response.status_code == 200
    auth_data = verify_response.json()
    assert "access_token" in auth_data
    assert auth_data["admin"]["username"] == "testadmin"

def test_admin_change_password(client, db):
    # Create admin and login
    hashed = bcrypt.hashpw("oldpassword".encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    admin = AdminAccount(username="testadmin", email="admin@test.com", password_hash=hashed, is_active=True)
    db.add(admin)
    db.commit()

    # Get full access token (simulating full flow)
    login_res = client.post("/admin/auth/login", json={"username": "testadmin", "password": "oldpassword"})
    otp = db.query(OTPVerification).filter(OTPVerification.email == "admin@test.com").first()
    verify_res = client.post("/admin/auth/verify-otp", json={
        "email": "admin@test.com",
        "code": otp.code,
        "temp_token": login_res.json()["temp_token"]
    })
    token = verify_res.json()["access_token"]

    # Change password
    headers = {"Authorization": f"Bearer {token}"}
    change_res = client.put("/admin/auth/change-password", headers=headers, json={
        "current_password": "oldpassword",
        "new_password": "newpassword123"
    })
    assert change_res.status_code == 200
    
    # Verify change
    db.refresh(admin)
    assert bcrypt.checkpw("newpassword123".encode("utf-8"), admin.password_hash.encode("utf-8"))
    assert admin.password_changed is True

def test_secure_users_endpoint(client, db):
    # Try without auth
    response = client.get("/admin/users")
    assert response.status_code == 403 # HTTPBearer returns 403 if missing header
