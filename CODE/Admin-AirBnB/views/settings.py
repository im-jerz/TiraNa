import streamlit as st

from database import SessionLocal
from services.auth_service import get_admin_by_id
from services.settings_service import get_all_settings, set_setting
from services.audit_service import log_action
from views.components.sidebar import render_sidebar


def render():
    if not st.session_state.get("logged_in"):
        st.warning("Please sign in to access the dashboard.")
        st.stop()

    db = SessionLocal()
    try:
        admin = get_admin_by_id(db, st.session_state.get("admin_id", ""))
    finally:
        db.close()

    if not admin:
        st.warning("Admin not found")
        st.stop()

    render_sidebar(admin)
    st.title("System Settings")

    settings = get_all_settings(db)
    settings_dict = {s.key: s for s in settings}

    tab_general, tab_commission, tab_api, tab_email, tab_payout = st.tabs([
        "General", "Commission", "API Configuration", "Email (SMTP)", "Payout"
    ])

    with tab_general:
        st.subheader("General Settings")

        with st.form("general_settings"):
            platform_name = st.text_input(
                "Platform Name",
                value=settings_dict.get("platform_name", type(lambda: None)).value if "platform_name" in settings_dict else "AirBnB Clone",
            )
            support_email = st.text_input(
                "Support Email",
                value=settings_dict.get("support_email", type(lambda: None)).value if "support_email" in settings_dict else "",
            )

            if st.form_submit_button("Save General Settings"):
                set_setting(db, "platform_name", platform_name, admin.id)
                set_setting(db, "support_email", support_email, admin.id)
                log_action(db, admin.id, "update_settings", "system", "general", "Updated general settings")
                st.success("General settings saved.")
                st.rerun()

    with tab_commission:
        st.subheader("Commission Settings")

        with st.form("commission_settings"):
            commission = st.number_input(
                "Commission Percentage (%)",
                min_value=0.0,
                max_value=100.0,
                value=float(settings_dict["commission_percent"].value) if "commission_percent" in settings_dict else 10.0,
                step=0.5,
            )

            if st.form_submit_button("Save Commission Settings"):
                set_setting(db, "commission_percent", str(commission), admin.id)
                log_action(db, admin.id, "update_settings", "system", "commission", f"Set commission to {commission}%")
                st.success("Commission settings saved.")
                st.rerun()

    with tab_api:
        st.subheader("Host API Configuration")

        with st.form("api_settings"):
            host_api_url = st.text_input(
                "Host API URL",
                value=settings_dict["host_api_url"].value if "host_api_url" in settings_dict else "http://localhost:5000",
            )
            host_api_key = st.text_input(
                "Host API Key",
                value=settings_dict["host_api_key"].value if "host_api_key" in settings_dict else "",
                type="password",
            )

            if st.form_submit_button("Save API Settings"):
                set_setting(db, "host_api_url", host_api_url, admin.id)
                set_setting(db, "host_api_key", host_api_key, admin.id)
                log_action(db, admin.id, "update_settings", "system", "api", "Updated API settings")
                st.success("API settings saved.")
                st.rerun()

    with tab_email:
        st.subheader("Email (SMTP) Settings")

        with st.form("email_settings"):
            smtp_host = st.text_input(
                "SMTP Host",
                value=settings_dict["smtp_host"].value if "smtp_host" in settings_dict else "smtp.gmail.com",
            )
            smtp_port = st.number_input(
                "SMTP Port",
                value=int(settings_dict["smtp_port"].value) if "smtp_port" in settings_dict else 587,
                min_value=1,
                max_value=65535,
            )
            smtp_user = st.text_input(
                "SMTP Username",
                value=settings_dict["smtp_user"].value if "smtp_user" in settings_dict else "",
            )
            smtp_from = st.text_input(
                "Sender Email",
                value=settings_dict["smtp_from"].value if "smtp_from" in settings_dict else "noreply@airbnb-admin.com",
            )

            if st.form_submit_button("Save Email Settings"):
                set_setting(db, "smtp_host", smtp_host, admin.id)
                set_setting(db, "smtp_port", str(smtp_port), admin.id)
                set_setting(db, "smtp_user", smtp_user, admin.id)
                set_setting(db, "smtp_from", smtp_from, admin.id)
                log_action(db, admin.id, "update_settings", "system", "email", "Updated SMTP settings")
                st.success("Email settings saved.")
                st.rerun()

    with tab_payout:
        st.subheader("Payout Settings")

        with st.form("payout_settings"):
            min_withdrawal = st.number_input(
                "Minimum Withdrawal Amount (PHP)",
                value=float(settings_dict["min_withdrawal_amount"].value) if "min_withdrawal_amount" in settings_dict else 500.0,
                min_value=0.0,
            )

            if st.form_submit_button("Save Payout Settings"):
                set_setting(db, "min_withdrawal_amount", str(min_withdrawal), admin.id)
                log_action(db, admin.id, "update_settings", "system", "payout", f"Set min withdrawal to PHP {min_withdrawal}")
                st.success("Payout settings saved.")
                st.rerun()
