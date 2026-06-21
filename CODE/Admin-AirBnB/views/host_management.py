import streamlit as st

from database import SessionLocal
from services.host_api import host_api
from services.audit_service import log_action
from views.components.sidebar import render_sidebar
from views.components.master_detail import render_master_detail
from utils.icons import list_icon, search_icon, svg_icon
from utils.auth import require_admin
from utils.constants import PAGE_SIZE


def _render_host_detail(host_id: str) -> None:
    host = host_api.get_host(host_id)
    if not host:
        with st.container(border=True):
            st.warning("Could not load host details.")
        return

    st.subheader(host.get("full_name", "Unknown"))
    st.write(f"**Email:** {host.get('email', '-')}")

    # Status badge
    status = host.get("status", "-")
    badge_class = f"status-{status}" if status in ["active", "suspended", "pending"] else ""
    st.markdown(f'**Status:** <span class="status-badge {badge_class}">{status.title()}</span>', unsafe_allow_html=True)

    st.write(f"**Total Rooms:** {host.get('total_rooms', 0)}")
    st.write(f"**Verification:** {host.get('verification_status', '-')}")
    st.write(f"**Joined:** {host.get('created_at', '-')}")

    st.divider()

    # Track which tabs have been viewed (for verification approval guard)
    info_key = f"host_viewed_info_{host_id}"
    verify_key = f"host_viewed_verify_{host_id}"
    if info_key not in st.session_state:
        st.session_state[info_key] = False
    if verify_key not in st.session_state:
        st.session_state[verify_key] = False

    tab_info, tab_verify, tab_wallet = st.tabs(["Info", "Verification", "Wallet"])

    # ── Info Tab ──────────────────────────────────────────
    with tab_info:
        st.session_state[info_key] = True

        st.subheader("Host Information")
        col1, col2 = st.columns(2)
        with col1:
            st.write(f"**Name:** {host.get('full_name', '-')}")
            st.write(f"**Email:** {host.get('email', '-')}")
            st.write(f"**Status:** {host.get('status', '-')}")
        with col2:
            st.write(f"**Total Rooms:** {host.get('total_rooms', 0)}")
            st.write(f"**Verification:** {host.get('verification_status', '-')}")
            st.write(f"**Joined:** {host.get('created_at', '-')}")

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

    # ── Verification Tab ──────────────────────────────────
    with tab_verify:
        st.session_state[verify_key] = True

        verification = host_api.get_verification(host_id)
        if verification:
            st.subheader("Verification Details")
            st.write(f"**Document Type:** {verification.get('document_type', '-')}")
            st.write(f"**Status:** {verification.get('status', '-')}")
            st.write(f"**Submitted:** {verification.get('submitted_at', '-')}")

            # Side-by-side document and selfie preview
            doc_url = verification.get("document_url")
            selfie_url = verification.get("selfie_url")

            if doc_url or selfie_url:
                st.divider()
                st.subheader("Documents")
                col_doc, col_selfie = st.columns(2)

                with col_doc:
                    st.write("**Government ID**")
                    if doc_url:
                        st.image(doc_url, use_container_width=True)
                    else:
                        st.info("No document uploaded")

                with col_selfie:
                    st.write("**Selfie**")
                    if selfie_url:
                        st.image(selfie_url, use_container_width=True)
                    else:
                        st.info("No selfie uploaded")

            st.divider()

            # Approve / Reject
            if verification.get("status") == "pending":
                # Check if both tabs have been viewed
                both_viewed = st.session_state.get(info_key, False) and st.session_state.get(verify_key, False)

                if not both_viewed:
                    st.warning("Please review both Info and Verification tabs before approving.")

                col1, col2 = st.columns(2)
                with col1:
                    if st.button("Approve", type="primary", disabled=not both_viewed):
                        result = host_api.approve_verification(verification.get("id", host_id))
                        if result:
                            db = SessionLocal()
                            try:
                                log_action(
                                    db, st.session_state.admin_id,
                                    "approve_verification", "verification", verification.get("id", host_id)
                                )
                            finally:
                                db.close()
                            st.success("Verification approved.")
                            st.rerun()
                        else:
                            st.error("Failed to approve verification.")

                with col2:
                    if st.button("Reject", type="secondary"):
                        st.session_state.show_reject_form = verification.get("id", host_id)

                if st.session_state.get("show_reject_form") == verification.get("id", host_id):
                    reason = st.text_area("Rejection reason", key="reject_reason")
                    if st.button("Confirm Rejection", type="primary"):
                        if not reason:
                            st.error("Please provide a reason.")
                        else:
                            result = host_api.reject_verification(verification.get("id", host_id), reason=reason)
                            if result:
                                db = SessionLocal()
                                try:
                                    log_action(
                                        db, st.session_state.admin_id,
                                        "reject_verification", "verification", verification.get("id", host_id), reason
                                    )
                                finally:
                                    db.close()
                                st.success("Verification rejected.")
                                st.session_state.pop("show_reject_form", None)
                                st.rerun()
                            else:
                                st.error("Failed to reject verification.")
            else:
                with st.container(border=True):
                    st.info(f"This verification has already been {verification.get('status')}.")
        else:
            with st.container(border=True):
                st.info("No verification request found for this host.")

    # ── Wallet Tab ────────────────────────────────────────
    with tab_wallet:
        st.subheader("Wallet")

        wallet = host_api.get_host_wallet(host_id)
        if wallet:
            col1, col2 = st.columns(2)
            with col1:
                st.metric("Balance", f"PHP {wallet.get('balance', 0):,.2f}")
            with col2:
                st.metric("Pending Payouts", f"PHP {wallet.get('pending_payouts', 0):,.2f}")

            st.divider()

            # Transaction history placeholder
            st.subheader("Recent Transactions")
            transactions = wallet.get("transactions", [])
            if transactions:
                for tx in transactions[:10]:
                    with st.container(border=True):
                        col1, col2, col3 = st.columns([2, 1, 1])
                        with col1:
                            st.write(f"**{tx.get('description', '-')}**")
                            st.caption(tx.get('date', '-'))
                        with col2:
                            st.write(f"PHP {tx.get('amount', 0):,.2f}")
                        with col3:
                            status = tx.get('status', '-')
                            color = {"completed": "#16a34a", "pending": "#d97706", "failed": "#dc2626"}.get(status, "#9ca3af")
                            st.markdown(f'<span style="color:{color};font-weight:500">{status.title()}</span>', unsafe_allow_html=True)
            else:
                st.info("No transactions yet.")
        else:
            with st.container(border=True):
                st.info("Wallet info unavailable.")


@require_admin
def render(*, admin):
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
        per_page=PAGE_SIZE,
    )

    items = data.get("hosts") if data else None
    total = data.get("total", 0) if data else 0

    render_master_detail(
        items=items,
        selection_key="selected_host_id",
        render_detail=_render_host_detail,
        title=f"{svg_icon(list_icon())} All Hosts",
        detail_title=f"{svg_icon(search_icon())} Host Details",
        label_fields=("full_name", "email"),
        no_items_message="No hosts found.",
        error_message="Could not load hosts. Host API may be unavailable.",
        total=total,
        page=page,
        per_page=PAGE_SIZE,
        page_state_key="host_page",
    )
