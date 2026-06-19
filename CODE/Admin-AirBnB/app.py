import logging
import time
import streamlit as st
from database import SessionLocal
from models import init_db
from config import Config

logging.basicConfig(level=logging.INFO, format="%(message)s")

st.set_page_config(layout="wide", initial_sidebar_state="collapsed")

if "db_initialized" not in st.session_state:
    init_db()
    st.session_state.db_initialized = True

# Session timeout check
if st.session_state.get("logged_in"):
    login_ts = st.session_state.get("login_timestamp", 0)
    if time.time() - login_ts > Config.SESSION_TIMEOUT_MINUTES * 60:
        for key in list(st.session_state.keys()):
            del st.session_state[key]
        st.session_state.page = "sign_in"
        st.rerun()

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

tirana_theme_css = """
    <style>
        /* ── Global background ─────────────────────────── */
        [data-testid="stApp"],
        .main .block-container {
            background-color: #2C3E2D !important;
            color: #F5F5F0 !important;
        }

        /* ── Sidebar ───────────────────────────────────── */
        [data-testid="stSidebar"] {
            background-color: #1E2B1F !important;
        }
        [data-testid="stSidebar"] .stMarkdown p,
        [data-testid="stSidebar"] .stMarkdown h1,
        [data-testid="stSidebar"] .stMarkdown h2,
        [data-testid="stSidebar"] .stMarkdown h3,
        [data-testid="stSidebar"] .stMarkdown h4,
        [data-testid="stSidebar"] .stMarkdown h5,
        [data-testid="stSidebar"] .stMarkdown h6,
        [data-testid="stSidebar"] .stCaption,
        [data-testid="stSidebar"] label,
        [data-testid="stSidebar"] span {
            color: #F5F5F0 !important;
        }
        [data-testid="stSidebar"] .stButton > button {
            background-color: #3A4F3B !important;
            color: #F5F5F0 !important;
            border: 1px solid #4A6B4C !important;
        }
        [data-testid="stSidebar"] .stButton > button:hover {
            background-color: #4A6B4C !important;
        }
        [data-testid="stSidebar"] .stButton > button[kind="primary"] {
            background-color: #6B8F5E !important;
            color: #F5F5F0 !important;
        }

        /* ── Headings & text ────────────────────────────── */
        h1, h2, h3, h4, h5, h6,
        .stMarkdown p,
        .stMarkdown li,
        .stMarkdown span,
        .stCaption,
        label,
        .stTabs [data-baseweb="tab"] {
            color: #F5F5F0 !important;
        }

        /* ── Text inputs & text areas ──────────────────── */
        .stTextInput > div > div > input,
        .stTextArea > div > div > textarea,
        .stNumberInput > div > div > input,
        .stDateInput > div > div > input {
            background-color: #3A4F3B !important;
            color: #F5F5F0 !important;
            border: 1px solid #4A6B4C !important;
        }
        .stTextInput > div > div > input:focus,
        .stTextArea > div > div > textarea:focus {
            border-color: #6B8F5E !important;
            box-shadow: 0 0 0 1px #6B8F5E !important;
        }

        /* ── Selectbox / Radio / Checkbox ──────────────── */
        .stSelectbox > div > div,
        .stMultiSelect > div > div,
        .stRadio > div {
            background-color: #3A4F3B !important;
            color: #F5F5F0 !important;
        }
        .stSelectbox [data-baseweb="select"] {
            background-color: #3A4F3B !important;
            color: #F5F5F0 !important;
        }
        .stSelectbox [data-baseweb="select"] svg {
            fill: #F5F5F0 !important;
        }
        .stRadio label,
        .stCheckbox label {
            color: #F5F5F0 !important;
        }

        /* ── Buttons ────────────────────────────────────── */
        .stButton > button {
            background-color: #6B8F5E !important;
            color: #F5F5F0 !important;
            border: none !important;
        }
        .stButton > button:hover {
            background-color: #8AAF7C !important;
            color: #F5F5F0 !important;
        }
        .stButton > button[kind="secondary"] {
            background-color: #3A4F3B !important;
            color: #F5F5F0 !important;
            border: 1px solid #4A6B4C !important;
        }
        .stButton > button[kind="secondary"]:hover {
            background-color: #4A6B4C !important;
        }
        .stDownloadButton > button {
            background-color: #6B8F5E !important;
            color: #F5F5F0 !important;
        }

        /* ── Metric cards ───────────────────────────────── */
        [data-testid="stMetric"] {
            background-color: #3A4F3B !important;
            border: 1px solid #4A6B4C !important;
            border-radius: 0.75rem !important;
            padding: 1rem !important;
        }
        [data-testid="stMetric"] label,
        [data-testid="stMetric"] [data-testid="stMetricValue"],
        [data-testid="stMetric"] [data-testid="stMetricDelta"] {
            color: #F5F5F0 !important;
        }

        /* ── Containers / Borders ───────────────────────── */
        [data-testid="stExpander"],
        .stContainer,
        [data-baseweb="modal"] {
            background-color: #3A4F3B !important;
            border-color: #4A6B4C !important;
        }

        /* ── Dividers ───────────────────────────────────── */
        hr {
            border-color: #4A6B4C !important;
        }

        /* ── Tabs ───────────────────────────────────────── */
        .stTabs [data-baseweb="tab-list"] {
            background-color: #2C3E2D !important;
        }
        .stTabs [data-baseweb="tab"] {
            color: #B8C9B9 !important;
        }
        .stTabs [aria-selected="true"] {
            color: #F5F5F0 !important;
            border-bottom-color: #6B8F5E !important;
        }

        /* ── Dataframe / Table ──────────────────────────── */
        .stDataFrame,
        [data-testid="stDataFrame"] {
            background-color: #3A4F3B !important;
        }

        /* ── Plotly charts background ───────────────────── */
        .stPlotlyChart .stAlert,
        .stPlotlyChart {
            background-color: transparent !important;
        }

        /* ── Toast / Alerts ─────────────────────────────── */
        .stAlert {
            background-color: #3A4F3B !important;
            border-color: #4A6B4C !important;
            color: #F5F5F0 !important;
        }

        /* ── Spinner / Progress ─────────────────────────── */
        .stSpinner > div {
            border-top-color: #6B8F5E !important;
        }

        /* ── Scrollbar ──────────────────────────────────── */
        ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        ::-webkit-scrollbar-track {
            background: #1E2B1F;
        }
        ::-webkit-scrollbar-thumb {
            background: #4A6B4C;
            border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: #6B8F5E;
        }
    </style>
"""

st.markdown(hide_header_css, unsafe_allow_html=True)
st.markdown(tirana_theme_css, unsafe_allow_html=True)

page = st.session_state.page

AUTHENTICATED_PAGES = {
    "dashboard", "listings_moderation", "bookings_management",
    "payments_refunds", "reviews_management", "user_management",
    "host_management", "host_verification", "support_tickets",
    "disputes", "admin_management", "settings",
}

if page not in AUTHENTICATED_PAGES:
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
elif page == "disputes":
    from views.disputes import render as render_disputes
    render_disputes()
elif page == "listings_moderation":
    from views.listings_moderation import render as render_listings_moderation
    render_listings_moderation()
elif page == "bookings_management":
    from views.bookings_management import render as render_bookings_management
    render_bookings_management()
elif page == "payments_refunds":
    from views.payments_refunds import render as render_payments_refunds
    render_payments_refunds()
elif page == "reviews_management":
    from views.reviews_management import render as render_reviews_management
    render_reviews_management()
elif page == "admin_management":
    from views.admin_management import render as render_admin_management
    render_admin_management()
elif page == "settings":
    from views.settings import render as render_settings
    render_settings()
