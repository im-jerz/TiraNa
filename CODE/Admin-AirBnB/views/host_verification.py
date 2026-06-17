import streamlit as st

from database import SessionLocal
from services.host_api import host_api
from services.audit_service import log_action
from services.auth_service import get_admin_by_id
from views.components.sidebar import render_sidebar
from views.components.master_detail import render_master_detail


PER_PAGE = 20


def _render_verification_detail(verification_id: str) -> None:
    verification = host_api.get_verification(verification_id)
    if not verification:
        with st.container(border=True):
            st.warning("Could not load verification details.")
        return

    st.subheader(verification.get("host_name", "Unknown"))
    st.write(f"**Email:** {verification.get('host_email', '-')}")
    st.write(f"**Document Type:** {verification.get('document_type', '-')}")
    st.write(f"**Status:** {verification.get('status', '-')}")
    st.write(f"**Submitted:** {verification.get('submitted_at', '-')}")

    # Document preview
    doc_url = verification.get("document_url")
    if doc_url:
        st.divider()
        st.subheader("Document")
        st.image(doc_url, use_container_width=True)

    selfie_url = verification.get("selfie_url")
    if selfie_url:
        st.subheader("Selfie")
        st.image(selfie_url, use_container_width=True)

    st.divider()

    # Approve / Reject
    if verification.get("status") == "pending":
        col1, col2 = st.columns(2)
        with col1:
            if st.button("Approve", type="primary"):
                result = host_api.approve_verification(verification_id)
                if result:
                    db = SessionLocal()
                    try:
                        log_action(
                            db, st.session_state.admin_id,
                            "approve_verification", "verification", verification_id
                        )
                    finally:
                        db.close()
                    st.success("Verification approved.")
                    st.rerun()
                else:
                    st.error("Failed to approve verification.")

        with col2:
            if st.button("Reject", type="secondary"):
                st.session_state.show_reject_form = verification_id

        if st.session_state.get("show_reject_form") == verification_id:
            reason = st.text_area("Rejection reason", key="reject_reason")
            if st.button("Confirm Rejection", type="primary"):
                if not reason:
                    st.error("Please provide a reason.")
                else:
                    result = host_api.reject_verification(verification_id, reason=reason)
                    if result:
                        db = SessionLocal()
                        try:
                            log_action(
                                db, st.session_state.admin_id,
                                "reject_verification", "verification", verification_id, reason
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
    st.title("Host Verification")

    # Status filter above the master-detail columns.
    status_filter = st.selectbox(
        "Status",
        ["pending", "approved", "rejected"],
        label_visibility="collapsed",
        key="verify_status_filter",
    )

    st.write("")

    page = st.session_state.get("verify_page", 1)
    data = host_api.get_verifications(
        status=status_filter,
        page=page,
        per_page=PER_PAGE,
    )

    items = data.get("verifications") if data else None
    total = data.get("total", 0) if data else 0

    render_master_detail(
        items=items,
        selection_key="selected_verification_id",
        render_detail=_render_verification_detail,
        title=f"📋 Verifications ({status_filter})",
        detail_title="🔍 Verification Details",
        label_fields=("host_name", "host_email"),
        no_items_message="No verification requests found.",
        error_message="Could not load verifications. Host API may be unavailable.",
        total=total,
        page=page,
        per_page=PER_PAGE,
        page_state_key="verify_page",
    )
