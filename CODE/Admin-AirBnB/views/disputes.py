import streamlit as st

from database import SessionLocal
from services.dispute_service import (
    get_disputes, get_dispute, assign_dispute, investigate_dispute,
    resolve_dispute, dismiss_dispute, add_message, get_messages,
)
from services.auth_service import get_admin_by_id
from views.components.sidebar import render_sidebar
from views.components.master_detail import render_master_detail
from utils.icons import scales_icon, search_icon, svg_icon


PER_PAGE = 20


def _dispute_label(dispute) -> str:
    booking_short = dispute.booking_id[:8] if dispute.booking_id else "?"
    reason_short = dispute.reason[:30] + "..." if len(dispute.reason) > 30 else dispute.reason
    return f"#{booking_short}  ·  {reason_short}"


def _dispute_subtitle(dispute) -> str:
    return f"[{dispute.status.upper()}]  ·  {dispute.created_at.strftime('%Y-%m-%d %H:%M')}"


def _fetch_disputes(search: str, status_filter: str, page: int):
    db = SessionLocal()
    try:
        status_param = "" if status_filter == "All" else status_filter
        data = get_disputes(db, status=status_param, page=page, per_page=PER_PAGE)
        disputes = data["disputes"]
        if search:
            s = search.lower()
            disputes = [d for d in disputes if s in d.booking_id.lower() or s in d.reason.lower()]
        items = [
            {
                "id": str(d.id),
                "booking_id": d.booking_id,
                "_subtitle": _dispute_subtitle(d),
                "_raw": d,
            }
            for d in disputes
        ]
        return items, data["total"]
    finally:
        db.close()


def _render_dispute_detail(dispute_id: str) -> None:
    db = SessionLocal()
    try:
        dispute = get_dispute(db, dispute_id)
        if not dispute:
            with st.container(border=True):
                st.warning("Dispute not found.")
            return

        st.subheader(f"Dispute — Booking {dispute.booking_id[:8]}...")

        c1, c2, c3 = st.columns(3)
        with c1:
            st.write(f"**Status:** {dispute.status.title()}")
        with c2:
            st.write(f"**Created:** {dispute.created_at.strftime('%Y-%m-%d %H:%M')}")
        with c3:
            if dispute.resolved_at:
                st.write(f"**Resolved:** {dispute.resolved_at.strftime('%Y-%m-%d %H:%M')}")

        st.write(f"**Guest ID:** {dispute.guest_id}")
        st.write(f"**Host ID:** {dispute.host_id}")
        st.write(f"**Booking ID:** {dispute.booking_id}")

        st.divider()
        st.subheader("Reason")
        st.write(dispute.reason)

        if dispute.resolution:
            st.divider()
            st.subheader("Resolution")
            st.write(dispute.resolution)

        if dispute.assigned_to:
            st.write(f"**Assigned to:** {dispute.assigned_to}")
        else:
            with st.container(border=True):
                st.warning("Unassigned")

        st.divider()

        # Actions
        if dispute.status not in ("resolved", "dismissed"):
            c1, c2, c3 = st.columns(3)
            with c1:
                if st.button("Assign to me", key="assign_dispute"):
                    assign_dispute(db, dispute_id, st.session_state.admin_id)
                    st.success("Dispute assigned to you.")
                    st.rerun()
            with c2:
                if dispute.status == "open":
                    if st.button("Investigate", type="secondary", key="investigate_dispute"):
                        investigate_dispute(db, dispute_id)
                        st.success("Dispute marked as investigating.")
                        st.rerun()
            with c3:
                if st.button("Resolve", type="primary", key="resolve_dispute_btn"):
                    st.session_state.show_resolve_form = dispute_id

            if st.session_state.get("show_resolve_form") == dispute_id:
                resolution = st.text_area("Resolution notes", key="resolve_notes")
                if st.button("Confirm Resolve", type="primary", key="confirm_resolve"):
                    if not resolution:
                        st.error("Please provide resolution notes.")
                    else:
                        resolve_dispute(db, dispute_id, resolution)
                        from services.audit_service import log_action
                        log_action(
                            db, st.session_state.admin_id,
                            "resolve_dispute", "dispute", dispute_id, resolution
                        )
                        st.success("Dispute resolved.")
                        st.session_state.pop("show_resolve_form", None)
                        st.rerun()

            st.divider()
            if st.button("Dismiss", type="secondary", key="dismiss_dispute"):
                st.session_state.show_dismiss_form = dispute_id

            if st.session_state.get("show_dismiss_form") == dispute_id:
                reason = st.text_area("Dismissal reason", key="dismiss_reason")
                if st.button("Confirm Dismiss", type="primary", key="confirm_dismiss"):
                    if not reason:
                        st.error("Please provide a reason.")
                    else:
                        dismiss_dispute(db, dispute_id, reason)
                        from services.audit_service import log_action
                        log_action(
                            db, st.session_state.admin_id,
                            "dismiss_dispute", "dispute", dispute_id, reason
                        )
                        st.success("Dispute dismissed.")
                        st.session_state.pop("show_dismiss_form", None)
                        st.rerun()

        st.divider()

        # Investigation notes / conversation
        st.subheader("Investigation Notes")
        messages = get_messages(db, dispute_id)
        for msg in messages:
            role = "assistant" if msg.sender == "admin" else "user"
            with st.chat_message(role):
                st.write(msg.message)
                st.caption(f"{msg.sender} — {msg.created_at.strftime('%Y-%m-%d %H:%M')}")

        # New note
        if dispute.status not in ("resolved", "dismissed"):
            with st.form("new_note", clear_on_submit=True):
                new_note = st.text_area("Add investigation note")
                submitted = st.form_submit_button("Add Note")
                if submitted and new_note:
                    add_message(db, dispute_id, "admin", new_note)
                    st.rerun()
    finally:
        db.close()


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
    st.title("Disputes")

    c1, c2 = st.columns([3, 1])
    with c1:
        search = st.text_input(
            "Search by booking ID or reason",
            placeholder="Search disputes...",
            label_visibility="collapsed",
            key="dispute_search",
        )
    with c2:
        status_filter = st.selectbox(
            "Status",
            ["All", "open", "investigating", "resolved", "dismissed"],
            label_visibility="collapsed",
            key="dispute_status_filter",
        )

    st.write("")

    page = st.session_state.get("dispute_page", 1)
    items, total = _fetch_disputes(search, status_filter, page)

    render_master_detail(
        items=items,
        selection_key="selected_dispute_id",
        render_detail=_render_dispute_detail,
        title=f"{svg_icon(scales_icon())} All Disputes",
        detail_title=f"{svg_icon(search_icon())} Dispute Details",
        label_fields=("booking_id",),
        no_items_message="No disputes found.",
        error_message="Could not load disputes.",
        total=total,
        page=page,
        per_page=PER_PAGE,
        page_state_key="dispute_page",
    )
