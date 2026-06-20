import streamlit as st

from database import SessionLocal
from services.settings_service import get_all_settings, set_setting
from services.audit_service import log_action
from views.components.sidebar import render_sidebar
from utils.auth import require_admin


@require_admin
def render(*, admin):
    render_sidebar(admin)
    st.title("System Settings")

    db_settings = SessionLocal()
    try:
        settings = get_all_settings(db_settings)
        settings_dict = {s.key: s for s in settings}

        tab_general, tab_commission, tab_api, tab_email, tab_payout = st.tabs([
            "General", "Commission", "API Configuration", "Email (SMTP)", "Payout"
        ])

        def _get_value(key: str, default):
            s = settings_dict.get(key)
            return s.value if s else default

        with tab_general:
            st.subheader("General Settings")

            with st.form("general_settings"):
                platform_name = st.text_input(
                    "Platform Name",
                    value=_get_value("platform_name", "AirBnB Clone"),
                )
                support_email = st.text_input(
                    "Support Email",
                    value=_get_value("support_email", ""),
                )

                if st.form_submit_button("Save General Settings"):
                    set_setting(db_settings, "platform_name", platform_name, admin.id)
                    set_setting(db_settings, "support_email", support_email, admin.id)
                    log_action(db_settings, admin.id, "update_settings", "system", "general", "Updated general settings")
                    st.success("General settings saved.")
                    st.rerun()

        with tab_commission:
            st.subheader("Commission Settings")

            with st.form("commission_settings"):
                commission = st.number_input(
                    "Commission Percentage (%)",
                    min_value=0.0,
                    max_value=100.0,
                    value=float(_get_value("commission_percent", 10.0)),
                    step=0.5,
                )

                if st.form_submit_button("Save Commission Settings"):
                    set_setting(db_settings, "commission_percent", str(commission), admin.id)
                    log_action(db_settings, admin.id, "update_settings", "system", "commission", f"Set commission to {commission}%")
                    st.success("Commission settings saved.")
                    st.rerun()

        with tab_api:
            st.subheader("Host API Configuration")

            with st.form("api_settings"):
                host_api_url = st.text_input(
                    "Host API URL",
                    value=_get_value("host_api_url", "http://localhost:5000"),
                )
                host_api_key = st.text_input(
                    "Host API Key",
                    value=_get_value("host_api_key", ""),
                    type="password",
                )

                if st.form_submit_button("Save API Settings"):
                    set_setting(db_settings, "host_api_url", host_api_url, admin.id)
                    set_setting(db_settings, "host_api_key", host_api_key, admin.id)
                    log_action(db_settings, admin.id, "update_settings", "system", "api", "Updated API settings")
                    st.success("API settings saved.")
                    st.rerun()

        with tab_email:
            st.subheader("Email (SMTP) Settings")

            with st.form("email_settings"):
                smtp_host = st.text_input(
                    "SMTP Host",
                    value=_get_value("smtp_host", "smtp.gmail.com"),
                )
                smtp_port = st.number_input(
                    "SMTP Port",
                    value=int(_get_value("smtp_port", 587)),
                    min_value=1,
                    max_value=65535,
                )
                smtp_user = st.text_input(
                    "SMTP Username",
                    value=_get_value("smtp_user", ""),
                )
                smtp_from = st.text_input(
                    "Sender Email",
                    value=_get_value("smtp_from", "noreply@airbnb-admin.com"),
                )

                if st.form_submit_button("Save Email Settings"):
                    set_setting(db_settings, "smtp_host", smtp_host, admin.id)
                    set_setting(db_settings, "smtp_port", str(smtp_port), admin.id)
                    set_setting(db_settings, "smtp_user", smtp_user, admin.id)
                    set_setting(db_settings, "smtp_from", smtp_from, admin.id)
                    log_action(db_settings, admin.id, "update_settings", "system", "email", "Updated SMTP settings")
                    st.success("Email settings saved.")
                    st.rerun()

        with tab_payout:
            st.subheader("Payout Settings")

            with st.form("payout_settings"):
                min_withdrawal = st.number_input(
                    "Minimum Withdrawal Amount (PHP)",
                    value=float(_get_value("min_withdrawal_amount", 500.0)),
                    min_value=0.0,
                )

                if st.form_submit_button("Save Payout Settings"):
                    set_setting(db_settings, "min_withdrawal_amount", str(min_withdrawal), admin.id)
                    log_action(db_settings, admin.id, "update_settings", "system", "payout", f"Set min withdrawal to PHP {min_withdrawal}")
                    st.success("Payout settings saved.")
                    st.rerun()
    finally:
        db_settings.close()
