import streamlit as st
from database import SessionLocal
from services.auth_service import register_admin


def render():
    col1, col2, col3 = st.columns([1, 1.5, 1])
    with col2:
        st.write("##")
        st.header("Create Account", anchor=False)

        with st.container(border=True):
            full_name = st.text_input(
                "Full Name",
                placeholder="Enter your full name",
                help="Your full legal name.",
            )
            email = st.text_input(
                "Email",
                placeholder="Enter your email",
                help="Used for login and notifications.",
            )
            password = st.text_input(
                "Password",
                type="password",
                placeholder="Create a password",
                help="Minimum 8 characters.",
            )
            confirm_password = st.text_input(
                "Confirm Password",
                type="password",
                placeholder="Confirm your password",
                help="Must match the password above.",
            )

            if st.button("Sign Up", key="signup_btn", use_container_width=True):
                if not full_name or not email or not password:
                    st.error("All fields are required")
                elif password != confirm_password:
                    st.error("Passwords do not match")
                elif len(password) < 6:
                    st.error("Password must be at least 6 characters")
                else:
                    db = SessionLocal()
                    try:
                        with st.spinner("Creating account…"):
                            admin_id, error = register_admin(db, email, password, full_name)
                        if error:
                            st.error(error)
                        else:
                            st.session_state.pending_admin_id = admin_id
                            st.session_state.pending_email = email
                            st.session_state.otp_purpose = "signup_verify"
                            st.rerun()
                    finally:
                        db.close()

        if st.button("Already have an account? Sign In", key="go_signin_btn", use_container_width=True):
            st.session_state.page = "sign_in"
            st.rerun()
