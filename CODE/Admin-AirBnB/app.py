import logging
import streamlit as st
from database import SessionLocal
from models import init_db

logging.basicConfig(level=logging.INFO, format="%(message)s")

st.set_page_config(layout="wide", initial_sidebar_state="collapsed")

if "db_initialized" not in st.session_state:
    init_db()
    st.session_state.db_initialized = True

if "page" not in st.session_state:
    if st.session_state.get("logged_in"):
        st.session_state.page = "dashboard"
    elif st.session_state.get("pending_admin_id"):
        st.session_state.page = "verify_otp"
    else:
        st.session_state.page = "sign_in"

# If a sign-in/sign-up just triggered an OTP, push the user to verify_otp.
if st.session_state.get("pending_admin_id") and st.session_state.page in ("sign_in", "sign_up"):
    st.session_state.page = "verify_otp"

# Only force routing for unauthenticated users hitting auth-only pages.
# Once logged in, respect the user's chosen page (sidebar nav).
if not st.session_state.get("logged_in"):
    if st.session_state.page not in ("sign_in", "sign_up", "verify_otp"):
        st.session_state.page = "sign_in"

hide_header_css = """
    <style>
        header[data-testid="stHeader"],
        [data-testid="stHeader"],
        .stAppDeployButton,
        header {
            display: none !important;
            visibility: hidden !important;
            height: 0px !important;
        }
        .block-container {
            padding-top: 2rem !important;
        }
    </style>
"""

hide_sidebar_css = """
    <style>
        [data-testid="stSidebarCollapseButton"],
        button[title="Open sidebar"],
        button[title="Close sidebar"] {
            display: none !important;
            visibility: hidden !important;
        }
    </style>
"""

st.markdown(hide_header_css, unsafe_allow_html=True)

page = st.session_state.page

if page not in ("dashboard", "user_management", "host_management", "host_verification", "support_tickets"):
    st.markdown(hide_sidebar_css, unsafe_allow_html=True)

if page == "sign_in":
    from views.sign_in import render as render_sign_in
    render_sign_in()
elif page == "sign_up":
    from views.sign_up import render as render_sign_up
    render_sign_up()
elif page == "verify_otp":
    from views.verify_otp import render as render_verify_otp
    render_verify_otp()
elif page == "dashboard":
    from views.dashboard import render as render_dashboard
    render_dashboard()
elif page == "user_management":
    from views.user_management import render as render_user_management
    render_user_management()
elif page == "host_management":
    from views.host_management import render as render_host_management
    render_host_management()
elif page == "host_verification":
    from views.host_verification import render as render_host_verification
    render_host_verification()
elif page == "support_tickets":
    from views.support_tickets import render as render_support_tickets
    render_support_tickets()
