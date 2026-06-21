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

        tab_general, tab_fees, tab_commission, tab_api, tab_email, tab_payout = st.tabs([
            "General", "Fees & Tax", "Commission", "API Configuration", "Email (SMTP)", "Payout"
        ])

        def _get_value(key: str, default):
            s = settings_dict.get(key)
            if not s:
                return default
            try:
                if isinstance(default, float):
                    return float(s.value)
                if isinstance(default, int):
                    return int(s.value)
            except (ValueError, TypeError):
                return default
            return s.value

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

            st.info(
                "Commission is currently **waived** for v1. "
                "No fees are charged to hosts. This setting is preserved for when commission is enabled in a future version."
            )

            with st.form("commission_settings"):
                commission = st.number_input(
                    "Platform Commission Percentage (%)",
                    min_value=0.0,
                    max_value=100.0,
                    value=_get_value("commission_percent", 0.0),
                    step=0.5,
                    disabled=True,
                    help="Commission is disabled for v1. The value is preserved for future use.",
                )

                st.caption("This setting will be re-enabled when commission is activated in a future version.")

                if st.form_submit_button("Save Commission Settings", disabled=True):
                    pass

        with tab_fees:
            st.subheader("Fees & Tax Configuration")

            with st.form("fees_settings"):
                tax_percent = st.number_input(
                    "VAT Tax (%)",
                    min_value=0.0,
                    max_value=100.0,
                    value=_get_value("tax_percent", 12.0),
                    step=0.5,
                )
                host_fee = st.number_input(
                    "Host Service Fee (%)",
                    min_value=0.0,
                    max_value=100.0,
                    value=_get_value("host_service_fee_percent", 3.0),
                    step=0.5,
                )
                guest_fee = st.number_input(
                    "Guest Service Fee (%)",
                    min_value=0.0,
                    max_value=100.0,
                    value=_get_value("guest_service_fee_percent", 14.0),
                    step=0.5,
                )

                st.divider()
                st.subheader("Cleaning Fee Limits")

                min_cleaning = st.number_input(
                    "Minimum Cleaning Fee (PHP)",
                    min_value=0.0,
                    value=_get_value("min_cleaning_fee", 0.0),
                    step=50.0,
                )
                max_cleaning = st.number_input(
                    "Maximum Cleaning Fee (PHP)",
                    min_value=0.0,
                    value=_get_value("max_cleaning_fee", 5000.0),
                    step=100.0,
                )
                default_cleaning = st.number_input(
                    "Default Cleaning Fee (PHP)",
                    min_value=0.0,
                    value=_get_value("default_cleaning_fee", 500.0),
                    step=50.0,
                )

                if st.form_submit_button("Save Fees & Tax Settings"):
                    set_setting(db_settings, "tax_percent", str(tax_percent), admin.id)
                    set_setting(db_settings, "host_service_fee_percent", str(host_fee), admin.id)
                    set_setting(db_settings, "guest_service_fee_percent", str(guest_fee), admin.id)
                    set_setting(db_settings, "min_cleaning_fee", str(min_cleaning), admin.id)
                    set_setting(db_settings, "max_cleaning_fee", str(max_cleaning), admin.id)
                    set_setting(db_settings, "default_cleaning_fee", str(default_cleaning), admin.id)
                    log_action(db_settings, admin.id, "update_settings", "system", "fees_tax", "Updated fees and tax settings")
                    st.success("Fees & Tax settings saved.")
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
                    value=_get_value("smtp_port", 587),
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
                    value=_get_value("min_withdrawal_amount", 500.0),
                    min_value=0.0,
                )

                if st.form_submit_button("Save Payout Settings"):
                    set_setting(db_settings, "min_withdrawal_amount", str(min_withdrawal), admin.id)
                    log_action(db_settings, admin.id, "update_settings", "system", "payout", f"Set min withdrawal to PHP {min_withdrawal}")
                    st.success("Payout settings saved.")
                    st.rerun()
    finally:
        db_settings.close()
