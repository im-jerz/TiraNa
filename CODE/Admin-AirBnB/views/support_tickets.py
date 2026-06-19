import streamlit as st

from database import SessionLocal
from services.support_service import (
    get_tickets, get_ticket, assign_ticket, resolve_ticket,
    add_message, get_messages,
)
from services.auth_service import get_admin_by_id
from views.components.sidebar import render_sidebar
from views.components.master_detail import render_master_detail
from utils.icons import list_icon, search_icon, svg_icon


PER_PAGE = 20


def _ticket_label(ticket) -> str:
    """Compact label for the master column: subject + status/priority hint."""
    subject = ticket.subject
    if len(subject) > 40:
        subject = subject[:37] + "..."
    return f"#{str(ticket.id)[:8]}  ·  {subject}"


def _ticket_subtitle(ticket) -> str:
    return f"[{ticket.status.upper()}] priority: {ticket.priority}  ·  {ticket.created_at.strftime('%Y-%m-%d %H:%M')}"


def _fetch_tickets(search: str, status_filter: str, priority_filter: str, page: int):
    """Run the support-tickets query and return (items_for_master, total)."""
    db = SessionLocal()
    try:
        status_param = "" if status_filter == "All" else status_filter
        data = get_tickets(db, status=status_param, page=page, per_page=PER_PAGE)
        tickets = data["tickets"]
        if search:
            s = search.lower()
            tickets = [t for t in tickets if s in t.subject.lower() or s in t.description.lower()]
        if priority_filter != "All":
            tickets = [t for t in tickets if t.priority == priority_filter]
        # Convert to dicts (the master_detail component expects dicts).
        items = [
            {
                "id": str(t.id),
                "subject": t.subject,
                "_subtitle": _ticket_subtitle(t),
                "_raw": t,
            }
            for t in tickets
        ]
        return items, data["total"]
    finally:
        db.close()


def _render_ticket_detail(ticket_id: str) -> None:
    db = SessionLocal()
    try:
        ticket = get_ticket(db, ticket_id)
        if not ticket:
            with st.container(border=True):
                st.warning("Ticket not found.")
            return

        st.subheader(ticket.subject)

        c1, c2, c3 = st.columns(3)
        with c1:
            st.write(f"**Status:** {ticket.status}")
        with c2:
            st.write(f"**Priority:** {ticket.priority}")
        with c3:
            st.write(f"**Created:** {ticket.created_at.strftime('%Y-%m-%d %H:%M')}")

        st.write(f"**Guest ID:** {ticket.guest_id}")
        st.write(f"**Description:** {ticket.description}")

        if ticket.assigned_to:
            st.write(f"**Assigned to:** {ticket.assigned_to}")
        else:
            with st.container(border=True):
                st.warning("Unassigned")

        st.divider()

        # Actions
        if ticket.status != "resolved":
            c1, c2 = st.columns(2)
            with c1:
                if st.button("Assign to me", key="assign_me"):
                    assign_ticket(db, ticket_id, st.session_state.admin_id)
                    st.success("Ticket assigned to you.")
                    st.rerun()
            with c2:
                if st.button("Resolve", type="primary", key="resolve_ticket"):
                    resolve_ticket(db, ticket_id)
                    st.success("Ticket resolved.")
                    st.rerun()

        st.divider()

        # Conversation
        st.subheader("Conversation")
        messages = get_messages(db, ticket_id)
        for msg in messages:
            role = "user" if msg.sender == "guest" else "assistant"
            with st.chat_message(role):
                st.write(msg.message)
                st.caption(f"{msg.sender} — {msg.created_at.strftime('%Y-%m-%d %H:%M')}")

        # New message
        if ticket.status != "resolved":
            with st.form("new_message", clear_on_submit=True):
                new_msg = st.text_area("Reply")
                submitted = st.form_submit_button("Send")
                if submitted and new_msg:
                    add_message(db, ticket_id, "admin", new_msg)
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
    st.title("Support Tickets")

    # Search + filters above the master-detail columns.
    c1, c2, c3 = st.columns([3, 1, 1])
    with c1:
        search = st.text_input(
            "Search tickets",
            placeholder="Search tickets...",
            label_visibility="collapsed",
            key="ticket_search",
        )
    with c2:
        status_filter = st.selectbox(
            "Status",
            ["All", "open", "in_progress", "resolved"],
            label_visibility="collapsed",
            key="ticket_status_filter",
        )
    with c3:
        priority_filter = st.selectbox(
            "Priority",
            ["All", "urgent", "high", "medium", "low"],
            label_visibility="collapsed",
            key="ticket_priority_filter",
        )

    st.write("")

    page = st.session_state.get("ticket_page", 1)
    items, total = _fetch_tickets(search, status_filter, priority_filter, page)

    render_master_detail(
        items=items,
        selection_key="selected_ticket_id",
        render_detail=_render_ticket_detail,
        title=f"{svg_icon(list_icon())} All Tickets",
        detail_title=f"{svg_icon(search_icon())} Ticket Details",
        label_fields=("subject", "id"),
        no_items_message="No tickets found.",
        error_message="Could not load tickets. Database may be unavailable.",
        total=total,
        page=page,
        per_page=PER_PAGE,
        page_state_key="ticket_page",
    )
