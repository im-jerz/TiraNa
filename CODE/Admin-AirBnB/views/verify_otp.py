import time
import streamlit as st
from config import Config
from database import SessionLocal
from services.auth_service import (
    verify_signup_otp,
    verify_signin_otp,
    has_valid_otp,
    resend_otp,
)


COOLDOWN_SECONDS = 60


def render():
    email = st.session_state.get("pending_email", "")
    admin_id = st.session_state.get("pending_admin_id", "")
    purpose = st.session_state.get("otp_purpose", "")

    if not admin_id:
        st.warning("No pending verification. Please sign in or sign up first.")
        st.stop()

    db = SessionLocal()
    try:
        valid_otp_exists = has_valid_otp(db, admin_id, purpose)
    finally:
        db.close()

    if not valid_otp_exists:
        st.info("Your verification code has expired or is already used. Please sign in again.")
        for key in ["pending_admin_id", "pending_email", "otp_purpose"]:
            st.session_state.pop(key, None)
        if st.button("Go to Sign In", key="expired_btn", use_container_width=True):
            st.session_state.page = "sign_in"
            st.rerun()
        st.stop()

    masked_email = email[:2] + "***" + email[email.index("@") :] if "@" in email else email

    col1, col2, col3 = st.columns([1, 1.5, 1])
    with col2:
        st.write("##")
        st.markdown("<h2 style='text-align: center;'>Verify OTP</h2>", unsafe_allow_html=True)
        st.info(f"A 6-digit code was sent to **{masked_email}**")

        if Config.APP_ENV == "development":
            st.warning("DEV MODE — Check the Docker logs for the OTP code:\n`docker compose logs streamlit`")

        with st.container(border=True):
            code = st.text_input("Enter 6-digit code", max_chars=6, placeholder="000000")

            if st.button("Verify", key="verify_btn", use_container_width=True):
                if len(code) != 6 or not code.isdigit():
                    st.error("Please enter a valid 6-digit code")
                else:
                    db = SessionLocal()
                    try:
                        if purpose == "signup_verify":
                            valid, error = verify_signup_otp(db, admin_id, code)
                        else:
                            valid, error = verify_signin_otp(db, admin_id, code)

                        if valid:
                            st.session_state.logged_in = True
                            st.session_state.admin_id = admin_id
                            st.session_state.login_timestamp = time.time()
                            st.session_state.page = "dashboard"
                            st.session_state.pop("pending_admin_id", None)
                            st.session_state.pop("pending_email", None)
                            st.session_state.pop("otp_purpose", None)
                            st.rerun()
                        else:
                            st.error(error or "Invalid or expired code")
                    finally:
                        db.close()

        col_a, col_b = st.columns(2)
        with col_a:
            cooldown_remaining = st.session_state.get("resend_cooldown", 0) - time.time()
            resend_disabled = cooldown_remaining > 0

            if resend_disabled:
                st.button(
                    f"Resend ({int(cooldown_remaining)}s)",
                    key="resend_btn",
                    use_container_width=True,
                    disabled=True,
                )
            else:
                if st.button("Resend Code", key="resend_btn", use_container_width=True):
                    db = SessionLocal()
                    try:
                        code, error = resend_otp(db, admin_id, purpose, email)
                        if error:
                            st.error(error)
                        else:
                            st.session_state.resend_cooldown = time.time() + COOLDOWN_SECONDS
                            st.success("A new code has been sent!")
                            st.rerun()
                    finally:
                        db.close()
        with col_b:
            if st.button("Back", key="back_btn", use_container_width=True):
                for key in ["pending_admin_id", "pending_email", "otp_purpose"]:
                    st.session_state.pop(key, None)
                st.rerun()
