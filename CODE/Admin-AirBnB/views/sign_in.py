import streamlit as st
from database import SessionLocal
from services.auth_service import login_admin


def render():
    col1, col2, col3 = st.columns([1, 1.5, 1])
    with col2:
        st.write("##")
        st.header("Sign In", anchor=False)

        with st.container(border=True):
            email = st.text_input(
                "Email",
                placeholder="Enter your email",
                help="Your registered admin email.",
            )
            password = st.text_input(
                "Password",
                type="password",
                placeholder="Enter your password",
                help="Your account password.",
            )

            if st.button("Sign In", key="signin_btn", use_container_width=True):
                if not email or not password:
                    st.error("Email and password are required")
                else:
                    db = SessionLocal()
                    try:
                        with st.spinner("Signing in…"):
                            admin_id, error = login_admin(db, email, password)
                        if error:
                            st.error(error)
                        else:
                            st.session_state.pending_admin_id = admin_id
                            st.session_state.pending_email = email
                            st.session_state.otp_purpose = "signin_verify"
                            st.rerun()
                    finally:
                        db.close()

        if st.button("Don't have an account? Sign Up", key="go_signup_btn", use_container_width=True):
            st.session_state.page = "sign_up"
            st.rerun()
