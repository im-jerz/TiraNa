import streamlit as st

from database import SessionLocal
from services.host_api import host_api
from services.audit_service import log_action
from services.auth_service import get_admin_by_id
from views.components.sidebar import render_sidebar
from views.components.master_detail import render_master_detail


PER_PAGE = 20


def _render_host_detail(host_id: str) -> None:
    host = host_api.get_host(host_id)
    if not host:
        with st.container(border=True):
            st.warning("Could not load host details.")
        return

    st.subheader(host.get("full_name", "Unknown"))
    st.write(f"**Email:** {host.get('email', '-')}")
    st.write(f"**Status:** {host.get('status', '-')}")
    st.write(f"**Total Rooms:** {host.get('total_rooms', 0)}")
    st.write(f"**Verification:** {host.get('verification_status', '-')}")
    st.write(f"**Joined:** {host.get('created_at', '-')}")

    st.divider()

    # Wallet
    st.subheader("Wallet")
    wallet = host_api.get_host_wallet(host_id)
    if wallet:
        st.write(f"**Balance:** ₱{wallet.get('balance', 0):,.2f}")
        st.write(f"**Pending Payouts:** ₱{wallet.get('pending_payouts', 0):,.2f}")
    else:
        with st.container(border=True):
            st.info("Wallet info unavailable.")

    st.divider()

    # Actions
    st.subheader("Actions")
    col1, col2 = st.columns(2)

    with col1:
        if st.button("Suspend Host", type="primary", disabled=host.get("status") == "suspended"):
            reason = st.text_input("Reason for suspension", key="suspend_reason")
            if reason:
                result = host_api.suspend_host(host_id, reason=reason)
                if result:
                    db = SessionLocal()
                    try:
                        log_action(db, st.session_state.admin_id, "suspend_host", "host", host_id, reason)
                    finally:
                        db.close()
                    st.success("Host suspended.")
                    st.rerun()
                else:
                    st.error("Failed to suspend host.")

        if st.button("Reactivate Host", disabled=host.get("status") != "suspended"):
            result = host_api.reactivate_host(host_id)
            if result:
                db = SessionLocal()
                try:
                    log_action(db, st.session_state.admin_id, "reactivate_host", "host", host_id)
                finally:
                    db.close()
                st.success("Host reactivated.")
                st.rerun()
            else:
                st.error("Failed to reactivate host.")

    with col2:
        if st.button("Delete Host", type="secondary"):
            st.session_state.confirm_delete_host = host_id

        if st.session_state.get("confirm_delete_host") == host_id:
            st.warning("Are you sure? This action cannot be undone.")
            c1, c2 = st.columns(2)
            with c1:
                if st.button("Yes, Delete", type="primary"):
                    result = host_api.delete_host(host_id)
                    if result:
                        db = SessionLocal()
                        try:
                            log_action(db, st.session_state.admin_id, "delete_host", "host", host_id)
                        finally:
                            db.close()
                        st.success("Host deleted.")
                        st.session_state.pop("confirm_delete_host", None)
                        st.rerun()
                    else:
                        st.error("Failed to delete host.")
            with c2:
                if st.button("Cancel"):
                    st.session_state.pop("confirm_delete_host", None)
                    st.rerun()


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
    st.title("Host Management")

    # Search + filter above the master-detail columns.
    col_search, col_status = st.columns([3, 1])
    with col_search:
        search = st.text_input(
            "Search by name or email",
            placeholder="Search by name or email...",
            label_visibility="collapsed",
            key="host_search",
        )
    with col_status:
        status_filter = st.selectbox(
            "Status",
            ["All", "Active", "Suspended", "Pending"],
            label_visibility="collapsed",
            key="host_status_filter",
        )

    st.write("")

    page = st.session_state.get("host_page", 1)
    status_param = "" if status_filter == "All" else status_filter.lower()

    data = host_api.get_hosts(
        search=search,
        status=status_param,
        page=page,
        per_page=PER_PAGE,
    )

    items = data.get("hosts") if data else None
    total = data.get("total", 0) if data else 0

    render_master_detail(
        items=items,
        selection_key="selected_host_id",
        render_detail=_render_host_detail,
        title="📋 All Hosts",
        detail_title="🔍 Host Details",
        label_fields=("full_name", "email"),
        no_items_message="No hosts found.",
        error_message="Could not load hosts. Host API may be unavailable.",
        total=total,
        page=page,
        per_page=PER_PAGE,
        page_state_key="host_page",
    )
