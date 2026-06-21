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
        [data-testid="stSidebar"] {
            display: none !important;
        }
    </style>
"""

tirana_theme_css = """
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT,WONK@9..144,300;700,0..100,0..1&family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

        :root {
            --font-display: 'Fraunces', Georgia, serif;
            --font-body: 'Sora', -apple-system, sans-serif;
            --font-mono: 'JetBrains Mono', 'Consolas', monospace;
            --color-primary: #7B1E3A;
            --color-primary-light: #A0455E;
            --color-primary-hover: #63152D;
            --color-primary-surface: #FDF1F4;
            --color-accent: #D4943E;
            --color-accent-hover: #C08434;
            --color-bg: #F8F5F0;
            --color-surface: #FFFFFF;
            --color-border: #E5DDD4;
            --color-text: #1C1816;
            --color-text-muted: #8A7D72;
            --color-sidebar-bg: #7B1E3A;
            --color-sidebar-text: #FFFFFF;
            --color-sidebar-hover: rgba(255,255,255,0.12);
            --color-sidebar-active: #D4943E;
            --color-success: #6B8F5E;
            --color-warning: #D4943E;
        }

        * { font-family: var(--font-body); }

        header[data-testid="stHeader"],
        [data-testid="stHeader"],
        .stAppDeployButton,
        header {
            display: none !important;
            visibility: hidden !important;
            height: 0px !important;
        }
        .block-container { padding-top: 1.5rem !important; }

        /* -- Canvas: light gray workspace ----------------------------- */
        [data-testid="stApp"],
        .main .block-container {
            background-color: var(--color-bg) !important;
            color: var(--color-text) !important;
        }

        /* -- Typography ------------------------------------------------ */
        h1, h2 {
            font-family: var(--font-display) !important;
            color: var(--color-text) !important;
            font-weight: 600 !important;
            letter-spacing: -0.01em !important;
        }
        h1 { font-size: 1.75rem !important; line-height: 1.3 !important; }
        h2 { font-size: 1.375rem !important; line-height: 1.35 !important; }
        h3, h4, h5, h6 {
            font-family: var(--font-body) !important;
            color: var(--color-text) !important;
        }
        h3 {
            font-size: 1.125rem !important;
            font-weight: 600 !important;
            line-height: 1.4 !important;
        }
        h4 {
            font-size: 1rem !important;
            font-weight: 600 !important;
        }
        h5 {
            font-size: 0.9375rem !important;
            font-weight: 500 !important;
        }
        h6 {
            font-size: 0.875rem !important;
            font-weight: 500 !important;
        }
        .stMarkdown p, .stMarkdown li, .stMarkdown span,
        .stCaption, label {
            font-family: var(--font-body) !important;
            color: var(--color-text) !important;
        }
        .stCaption { font-size: 0.8125rem !important; color: var(--color-text-muted) !important; }

        hr {
            border-color: var(--color-border) !important;
            margin: 1.25rem 0 !important;
            opacity: 0.5;
        }

        /* -- Page header accent ---------------------------------------- */
        .page-head {
            margin-bottom: 1.5rem !important;
        }
        .page-head h1 {
            margin-bottom: 0.5rem !important;
        }
        .page-head .accent-line {
            height: 3px;
            width: 2.5rem;
            background-color: var(--color-accent);
            border-radius: 2px;
        }

        /* -- Sidebar: burgundy, collapsible ---------------------------- */
        [data-testid="stSidebar"] {
            background-color: var(--color-sidebar-bg) !important;
            transition: width 0.2s ease !important;
        }
        [data-testid="stSidebar"] .stMarkdown p,
        [data-testid="stSidebar"] .stMarkdown h1,
        [data-testid="stSidebar"] .stMarkdown h2,
        [data-testid="stSidebar"] .stMarkdown h3,
        [data-testid="stSidebar"] .stMarkdown h4,
        [data-testid="stSidebar"] .stMarkdown h5,
        [data-testid="stSidebar"] .stMarkdown h6 {
            color: var(--color-sidebar-text) !important;
            font-family: var(--font-body) !important;
        }
        [data-testid="stSidebar"] .stMarkdown h3 {
            font-family: var(--font-body) !important;
            font-weight: 600 !important;
            font-size: 0.7rem !important;
            text-transform: uppercase !important;
            letter-spacing: 0.08em !important;
            color: rgba(255,255,255,0.4) !important;
            margin-bottom: 0.5rem !important;
        }
        [data-testid="stSidebar"] .stCaption,
        [data-testid="stSidebar"] label,
        [data-testid="stSidebar"] span {
            color: var(--color-sidebar-text) !important;
        }
        [data-testid="stSidebar"] hr {
            border-color: rgba(255,255,255,0.08) !important;
        }
        [data-testid="stSidebar"] .stButton > button {
            background-color: transparent !important;
            color: var(--color-sidebar-text) !important;
            border: none !important;
            border-radius: 0.375rem !important;
            padding: 0.45rem 0.75rem !important;
            font-family: var(--font-body) !important;
            font-size: 0.9375rem !important;
            font-weight: 400 !important;
            text-align: left !important;
            transition: background-color 0.15s ease !important;
        }
        [data-testid="stSidebar"] .stButton > button:hover {
            background-color: var(--color-sidebar-hover) !important;
            color: var(--color-sidebar-text) !important;
        }
        [data-testid="stSidebar"] .stButton > button[kind="primary"] {
            background-color: var(--color-sidebar-active) !important;
            color: #FFFFFF !important;
            font-weight: 500 !important;
        }
        [data-testid="stSidebar"] .stButton > button[kind="primary"]:hover {
            background-color: var(--color-primary-hover) !important;
            color: #FFFFFF !important;
        }

        /* -- Sidebar collapse/expand buttons --------------------------- */
        [data-testid="stSidebarCollapseButton"],
        button[title="Open sidebar"],
        button[title="Close sidebar"] {
            opacity: 0.6 !important;
            transition: opacity 0.15s ease !important;
            color: #FFFFFF !important;
        }
        [data-testid="stSidebarCollapseButton"]:hover,
        button[title="Close sidebar"]:hover {
            opacity: 1 !important;
        }
        button[title="Open sidebar"] {
            background-color: var(--color-sidebar-bg) !important;
            opacity: 0.8 !important;
            border-radius: 0 0.375rem 0.375rem 0 !important;
        }
        button[title="Open sidebar"]:hover {
            opacity: 1 !important;
        }

        /* -- Inputs ---------------------------------------------------- */
        .stTextInput > div > div > input,
        .stTextArea > div > div > textarea,
        .stNumberInput > div > div > input,
        .stDateInput > div > div > input {
            background-color: var(--color-surface) !important;
            color: var(--color-text) !important;
            border: 1px solid var(--color-border) !important;
            border-radius: 0.375rem !important;
            font-family: var(--font-body) !important;
            font-size: 0.9375rem !important;
            padding: 0.5rem 0.75rem !important;
        }
        .stTextInput > div > div > input:focus,
        .stTextArea > div > div > textarea:focus {
            border-color: var(--color-accent) !important;
            box-shadow: 0 0 0 3px rgba(212,148,62,0.25) !important;
        }
        .stSelectbox > div > div,
        .stMultiSelect > div > div,
        .stRadio > div {
            background-color: var(--color-surface) !important;
            color: var(--color-text) !important;
        }
        .stSelectbox [data-baseweb="select"] {
            background-color: var(--color-surface) !important;
            color: var(--color-text) !important;
            border-color: var(--color-border) !important;
        }
        .stSelectbox [data-baseweb="select"] svg { fill: var(--color-text-muted) !important; }
        .stRadio label, .stCheckbox label { color: var(--color-text) !important; }

        /* -- Buttons --------------------------------------------------- */
        .stButton > button {
            background-color: var(--color-primary) !important;
            color: #FFFFFF !important;
            border: none !important;
            border-radius: 0.375rem !important;
            font-family: var(--font-body) !important;
            font-size: 0.875rem !important;
            font-weight: 500 !important;
            padding: 0.45rem 1rem !important;
            transition: background-color 0.15s ease !important;
        }
        .stButton > button:hover {
            background-color: var(--color-primary-hover) !important;
            color: #FFFFFF !important;
        }
        .stButton > button[kind="secondary"] {
            background: none !important;
            color: var(--color-text-muted) !important;
            border: none !important;
            font-size: 0.875rem !important;
            font-weight: 400 !important;
            padding: 0.25rem 0.5rem !important;
            text-decoration: underline;
            text-underline-offset: 2px;
            text-decoration-color: transparent;
            transition: color 0.15s ease, text-decoration-color 0.15s ease;
        }
        .stButton > button[kind="secondary"]:hover {
            color: var(--color-accent) !important;
            background: none !important;
            text-decoration-color: var(--color-accent);
        }
        .stDownloadButton > button {
            background-color: var(--color-primary) !important;
            color: #FFFFFF !important;
        }

        /* -- Metric cards ---------------------------------------------- */
        [data-testid="stMetric"] {
            background-color: var(--color-surface) !important;
            border: 1px solid var(--color-border) !important;
            border-top: 3px solid var(--color-accent) !important;
            border-radius: 0.5rem !important;
            padding: 1.25rem 1rem !important;
            box-shadow: 0 1px 3px rgba(44,24,16,0.06) !important;
        }
        [data-testid="stMetric"] label {
            font-family: var(--font-body) !important;
            font-size: 0.8125rem !important;
            font-weight: 500 !important;
            color: var(--color-text-muted) !important;
            text-transform: uppercase !important;
            letter-spacing: 0.04em !important;
        }
        [data-testid="stMetric"] [data-testid="stMetricValue"] {
            font-family: var(--font-mono) !important;
            font-size: 1.75rem !important;
            font-weight: 600 !important;
            color: var(--color-text) !important;
            line-height: 1.2 !important;
        }
        [data-testid="stMetric"] [data-testid="stMetricDelta"] {
            font-family: var(--font-body) !important;
            color: var(--color-text-muted) !important;
        }

        /* -- Containers ------------------------------------------------ */
        [data-testid="stExpander"],
        .stContainer,
        [data-baseweb="modal"] {
            background-color: var(--color-surface) !important;
            border-color: var(--color-border) !important;
            border-radius: 0.5rem !important;
        }
        .stContainer {
            border: 1px solid var(--color-border) !important;
            box-shadow: 0 1px 3px rgba(44,24,16,0.06) !important;
        }

        /* -- Tabs ------------------------------------------------------ */
        .stTabs [data-baseweb="tab-list"] {
            background-color: transparent !important;
            border-bottom: 1px solid var(--color-border) !important;
            gap: 0 !important;
        }
        .stTabs [data-baseweb="tab"] {
            color: var(--color-text-muted) !important;
            font-family: var(--font-body) !important;
            font-size: 0.875rem !important;
            font-weight: 500 !important;
            padding: 0.5rem 1rem !important;
        }
        .stTabs [aria-selected="true"] {
            color: var(--color-primary) !important;
            border-bottom-color: var(--color-primary) !important;
            font-weight: 600 !important;
        }

        /* -- DataFrames ------------------------------------------------ */
        .stDataFrame,
        [data-testid="stDataFrame"] {
            background-color: var(--color-surface) !important;
        }
        .stDataFrame [data-testid="StyledDataFrameColHeader"] {
            font-family: var(--font-body) !important;
        }

        /* -- Charts ---------------------------------------------------- */
        .stPlotlyChart .stAlert,
        .stPlotlyChart { background-color: transparent !important; }

        /* -- Alerts ---------------------------------------------------- */
        .stAlert {
            background-color: var(--color-surface) !important;
            border: 1px solid var(--color-border) !important;
            border-left: 4px solid var(--color-accent) !important;
            color: var(--color-text) !important;
            font-family: var(--font-body) !important;
            border-radius: 0.375rem !important;
        }

        .stSpinner > div { border-top-color: var(--color-primary) !important; }

        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #EDE8E0; }
        ::-webkit-scrollbar-thumb { background: #C4B8AA; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #A89888; }

        .element-container:has(> .stAlert) { margin-bottom: 0.5rem; }

        /* -- KPI grid (dashboard) -------------------------------------- */
        .kpi-grid {
            display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 0.5rem;
        }
        .kpi-card {
            background: var(--color-surface); border: 1px solid var(--color-border);
            border-top: 3px solid var(--color-accent); border-radius: 0.5rem;
            padding: 1.25rem 1rem; box-shadow: 0 1px 3px rgba(44,24,16,0.06);
        }
        .kpi-card .kpi-label {
            font-family: var(--font-body); font-size: 0.8125rem; font-weight: 500;
            color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.04em;
        }
        .kpi-card .kpi-value {
            font-family: var(--font-mono); font-size: 1.75rem; font-weight: 600;
            color: var(--color-text); line-height: 1.2; margin-top: 0.25rem;
        }
        .kpi-card .kpi-sub {
            font-family: var(--font-body); font-size: 0.8125rem; color: var(--color-text-muted); margin-top: 0.125rem;
        }

        /* -- Section card (dashboard panels) -------------------------- */
        .section-card {
            background: var(--color-surface);
            border: 1px solid var(--color-border);
            border-top: 3px solid var(--color-accent);
            border-radius: 0.5rem;
            padding: 1rem 1.125rem;
            box-shadow: 0 1px 3px rgba(44,24,16,0.06);
        }
        .section-card h3 {
            margin-top: 0 !important;
            margin-bottom: 0.75rem !important;
        }

        /* -- Quick action cards (dashboard) ---------------------------- */
        .qa-grid .stButton > button {
            background: var(--color-surface) !important;
            color: var(--color-text) !important;
            border: 1px solid var(--color-border) !important;
            border-top: 3px solid var(--color-accent) !important;
            border-radius: 0.5rem !important;
            padding: 1rem 0.75rem !important;
            height: 100% !important;
            min-height: 5rem;
            box-shadow: 0 1px 3px rgba(44,24,16,0.06) !important;
            transition: border-color 0.15s ease, box-shadow 0.15s ease !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            white-space: normal !important;
            word-wrap: break-word !important;
            line-height: 1.4 !important;
        }
        .qa-grid .stButton > button:hover {
            border-color: var(--color-accent) !important;
            box-shadow: 0 2px 8px rgba(212,148,62,0.12) !important;
            background: var(--color-surface) !important;
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
