import streamlit as st

from database import SessionLocal
from services.host_api import host_api
from services.support_service import get_tickets
from services.activity_service import get_activities
from services.audit_service import log_action
from views.components.sidebar import render_sidebar
from views.components.master_detail import render_master_detail
from utils.icons import list_icon, search_icon, svg_icon
from utils.auth import require_admin
from utils.constants import PAGE_SIZE


def _render_guest_detail(guest_id: str) -> None:
    guest = host_api.get_guest(guest_id)
    if not guest:
        with st.container(border=True):
            st.warning("Could not load guest details.")
        return

    st.subheader(guest.get("full_name", "Unknown"))
    st.write(f"**Email:** {guest.get('email', '-')}")
    st.write(f"**Phone:** {guest.get('phone', '-')}")
    st.write(f"**Status:** {guest.get('status', '-')}")
    st.write(f"**Joined:** {guest.get('created_at', '-')}")

    st.divider()

    # Verification Information
    st.subheader("Verification Information")
    col_v1, col_v2 = st.columns(2)
    with col_v1:
        verification_status = guest.get("verification_status", "not_verified")
        status_color = {"verified": "green", "pending": "orange", "not_verified": "gray"}.get(verification_status, "gray")
        st.markdown(f"**Identity Verification:** :{status_color}[{verification_status.replace('_', ' ').title()}]")
        id_doc_type = guest.get("id_document_type", "-")
        st.write(f"**ID Document Type:** {id_doc_type.replace('_', ' ').title() if id_doc_type != '-' else '-'}")
    with col_v2:
        phone_verified = guest.get("phone_verified", False)
        st.markdown(f"**Phone Verified:** :{'green' if phone_verified else 'red'}[{'Yes' if phone_verified else 'No'}]")
        email_verified = guest.get("email_verified", False)
        st.markdown(f"**Email Verified:** :{'green' if email_verified else 'red'}[{'Yes' if email_verified else 'No'}]")

    st.divider()

    # Ban / Unban
    col_ban, col_unban = st.columns(2)
    with col_ban:
        if st.button("Ban Guest", type="primary", disabled=guest.get("status") == "banned", key="ban_guest_btn"):
            st.session_state["show_ban_form"] = True
        if st.session_state.get("show_ban_form"):
            reason = st.text_input("Reason for ban", key="ban_reason")
            if st.button("Confirm Ban", type="primary", key="confirm_ban_btn"):
                if not reason:
                    st.error("Please provide a reason.")
                else:
                    result = host_api.ban_guest(guest_id, reason=reason)
                    if result:
                        db = SessionLocal()
                        try:
                            log_action(db, st.session_state.admin_id, "ban_guest", "guest", guest_id, reason)
                        finally:
                            db.close()
                        st.success("Guest banned.")
                        st.session_state.pop("show_ban_form", None)
                        st.rerun()
                    else:
                        st.error("Failed to ban guest.")
    with col_unban:
        if st.button("Unban Guest", disabled=guest.get("status") != "banned", key="unban_guest_btn"):
            result = host_api.unban_guest(guest_id)
            if result:
                db = SessionLocal()
                try:
                    log_action(db, st.session_state.admin_id, "unban_guest", "guest", guest_id)
                finally:
                    db.close()
                st.success("Guest unbanned.")
                st.rerun()
            else:
                st.error("Failed to unban guest.")

    st.divider()

    # Activity Log
    st.subheader("Activity Log")
    db = SessionLocal()
    try:
        activity_data = get_activities(db, guest_id)
        if activity_data["activities"]:
            for a in activity_data["activities"]:
                st.write(f"`{a.created_at}` — **{a.action}** {a.details or ''}")
        else:
            with st.container(border=True):
                st.info("No activity logged yet.")
    finally:
        db.close()

    st.divider()

    # Support Tickets
    st.subheader("Support Tickets")
    db = SessionLocal()
    try:
        ticket_data = get_tickets(db, assigned_to="")
        guest_tickets = [t for t in ticket_data["tickets"] if t.guest_id == guest_id]
        if guest_tickets:
            for t in guest_tickets:
                st.write(f"[{t.status}] {t.subject} — {t.created_at}")
        else:
            with st.container(border=True):
                st.info("No support tickets for this guest.")
    finally:
        db.close()


@require_admin
def render(*, admin):
    render_sidebar(admin)
    st.title("User / Guest Management")

    # Search + filter live above the master-detail columns.
    col_search, col_status = st.columns([3, 1])
    with col_search:
        search = st.text_input(
            "Search by name or email",
            placeholder="Search by name or email...",
            label_visibility="collapsed",
            key="guest_search",
        )
    with col_status:
        status_filter = st.selectbox(
            "Status",
            ["All", "Active", "Banned"],
            label_visibility="collapsed",
            key="guest_status_filter",
        )

    st.write("")

    page = st.session_state.get("guest_page", 1)
    status_param = "" if status_filter == "All" else status_filter.lower()

    data = host_api.get_guests(
        search=search,
        status=status_param,
        page=page,
        per_page=PAGE_SIZE,
    )

    items = data.get("guests") if data else None
    total = data.get("total", 0) if data else 0

    render_master_detail(
        items=items,
        selection_key="selected_guest_id",
        render_detail=_render_guest_detail,
        title=f"{svg_icon(list_icon())} All Guests",
        detail_title=f"{svg_icon(search_icon())} Guest Details",
        label_fields=("full_name", "email"),
        no_items_message="No guests found.",
        error_message="Could not load guests. Host API may be unavailable.",
        total=total,
        page=page,
        per_page=PAGE_SIZE,
        page_state_key="guest_page",
    )
