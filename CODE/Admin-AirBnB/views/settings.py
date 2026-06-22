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

        tab_general, tab_fees, tab_commission, tab_email, tab_payout = st.tabs([
            "General", "Fees & Tax", "Commission", "Email (SMTP)", "Payout"
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
            st.subheader("General settings")
            st.caption("Configure platform-wide settings including display name and support contact.")

            with st.container(border=True):
                with st.form("general_settings"):
                    platform_name = st.text_input(
                        "Platform name",
                        value=_get_value("platform_name", "AirBnB Clone"),
                        help="Display name shown in the admin sidebar and notifications.",
                    )
                    support_email = st.text_input(
                        "Support email",
                        value=_get_value("support_email", ""),
                        help="Contact email for user support inquiries.",
                    )

                    if st.form_submit_button("Save General Settings"):
                        set_setting(db_settings, "platform_name", platform_name, admin.id)
                        set_setting(db_settings, "support_email", support_email, admin.id)
                        log_action(db_settings, admin.id, "update_settings", "system", "general", "Updated general settings")
                        st.success("General settings saved.")
                        st.rerun()

        with tab_commission:
            st.subheader("Commission settings")
            st.info(
                "Commission is currently **waived** for v1. "
                "No fees are charged to hosts. This setting is preserved for when commission is enabled in a future version."
            )

            with st.container(border=True):
                with st.form("commission_settings"):
                    commission = st.number_input(
                        "Platform commission (%)",
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
            st.subheader("Fees & tax configuration")
            st.caption("Set tax rates and service fees charged to hosts and guests.")

            with st.container(border=True):
                with st.form("fees_settings"):
                    tax_percent = st.number_input(
                        "VAT tax (%)",
                        min_value=0.0,
                        max_value=100.0,
                        value=_get_value("tax_percent", 12.0),
                        step=0.5,
                        help="Value-added tax applied to booking totals.",
                    )
                    host_fee = st.number_input(
                        "Host service fee (%)",
                        min_value=0.0,
                        max_value=100.0,
                        value=_get_value("host_service_fee_percent", 3.0),
                        step=0.5,
                        help="Percentage charged to hosts on each booking.",
                    )
                    guest_fee = st.number_input(
                        "Guest service fee (%)",
                        min_value=0.0,
                        max_value=100.0,
                        value=_get_value("guest_service_fee_percent", 14.0),
                        step=0.5,
                        help="Percentage charged to guests on each booking.",
                    )

                    st.divider()
                    st.subheader("Cleaning fee limits")

                    min_cleaning = st.number_input(
                        "Minimum cleaning fee (PHP)",
                        min_value=0.0,
                        value=_get_value("min_cleaning_fee", 0.0),
                        step=50.0,
                        help="Lowest cleaning fee a host can set.",
                    )
                    max_cleaning = st.number_input(
                        "Maximum cleaning fee (PHP)",
                        min_value=0.0,
                        value=_get_value("max_cleaning_fee", 5000.0),
                        step=100.0,
                        help="Highest cleaning fee a host can set.",
                    )
                    default_cleaning = st.number_input(
                        "Default cleaning fee (PHP)",
                        min_value=0.0,
                        value=_get_value("default_cleaning_fee", 500.0),
                        step=50.0,
                        help="Pre-filled cleaning fee for new listings.",
                    )

                    if st.form_submit_button("Save Fees & Tax Settings"):
                        set_setting(db_settings, "tax_percent", str(tax_percent), admin.id)
                        set_setting(db_settings, "host_service_fee_percent", str(host_fee), admin.id)
                        set_setting(db_settings, "guest_service_fee_percent", str(guest_fee), admin.id)
                        set_setting(db_settings, "min_cleaning_fee", str(min_cleaning), admin.id)
                        set_setting(db_settings, "max_cleaning_fee", str(max_cleaning), admin.id)
                        set_setting(db_settings, "default_cleaning_fee", str(default_cleaning), admin.id)
                        log_action(db_settings, admin.id, "update_settings", "system", "fees_tax", "Updated fees and tax settings")
                        st.success("Fees & tax settings saved.")
                        st.rerun()

        with tab_email:
            st.subheader("Email (SMTP) settings")
            st.caption("Configure the mail server for sending notifications to users.")

            with st.container(border=True):
                with st.form("email_settings"):
                    smtp_host = st.text_input(
                        "SMTP host",
                        value=_get_value("smtp_host", "smtp.gmail.com"),
                        help="Mail server address (e.g., smtp.gmail.com).",
                    )
                    smtp_port = st.number_input(
                        "SMTP port",
                        value=_get_value("smtp_port", 587),
                        min_value=1,
                        max_value=65535,
                        help="TLS port typically 587; SSL port typically 465.",
                    )
                    smtp_user = st.text_input(
                        "SMTP username",
                        value=_get_value("smtp_user", ""),
                        help="Authentication username for the mail server.",
                    )
                    smtp_from = st.text_input(
                        "Sender email",
                        value=_get_value("smtp_from", "noreply@airbnb-admin.com"),
                        help="From address displayed on outgoing emails.",
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
            st.subheader("Payout settings")
            st.caption("Control minimum withdrawal thresholds for host payouts.")

            with st.container(border=True):
                with st.form("payout_settings"):
                    min_withdrawal = st.number_input(
                        "Minimum withdrawal amount (PHP)",
                        value=_get_value("min_withdrawal_amount", 500.0),
                        min_value=0.0,
                        help="Minimum amount hosts can withdraw from their wallet.",
                    )

                    if st.form_submit_button("Save Payout Settings"):
                        set_setting(db_settings, "min_withdrawal_amount", str(min_withdrawal), admin.id)
                        log_action(db_settings, admin.id, "update_settings", "system", "payout", f"Set min withdrawal to PHP {min_withdrawal}")
                        st.success("Payout settings saved.")
                        st.rerun()
    finally:
        db_settings.close()
