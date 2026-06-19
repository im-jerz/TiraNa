import streamlit as st
import pandas as pd
from sqlalchemy import desc

from database import SessionLocal
from models.booking_copy import BookingCache
from services.host_api import host_api
from services.audit_service import log_action
from services.sync_service import sync_bookings
from services.auth_service import get_admin_by_id
from views.components.sidebar import render_sidebar


PER_PAGE = 20

STATUS_OPTIONS = ["", "confirmed", "completed", "cancelled", "pending"]
STATUS_LABELS = ["All Statuses", "Confirmed", "Completed", "Cancelled", "Pending"]


def _render_booking_timeline(booking_id: str) -> None:
    timeline = host_api.get_booking_timeline(booking_id)
    if not timeline:
        st.info("No timeline data available.")
        return

    for entry in timeline:
        status = entry.get("status", "")
        changed_at = entry.get("changed_at", "")
        note = entry.get("note", "")
        with st.container(border=True):
            st.write(f"**{status}** - {changed_at}")
            if note:
                st.caption(note)


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
    st.title("Bookings Management")

    # Sync from Host API
    db = SessionLocal()
    try:
        sync_bookings(db)
    finally:
        db.close()

    col1, col2 = st.columns([1, 2])
    with col1:
        status_idx = st.selectbox(
            "Status",
            STATUS_OPTIONS,
            format_func=lambda x: STATUS_LABELS[STATUS_OPTIONS.index(x)],
            label_visibility="collapsed",
            key="booking_status_filter",
        )
    with col2:
        export_col1, export_col2 = st.columns([3, 1])
        with export_col2:
            if st.button("Export CSV", key="export_bookings"):
                st.session_state.show_export_bookings = True

    st.write("")

    page = st.session_state.get("bookings_page", 1)
    status_filter = status_idx

    # Query from cache
    db = SessionLocal()
    try:
        query = db.query(BookingCache)
        if status_filter:
            query = query.filter(BookingCache.status == status_filter)
        total = query.count()
        bookings = query.order_by(desc(BookingCache.created_at)).offset((page - 1) * PER_PAGE).limit(PER_PAGE).all()
        bookings_data = [
            {
                "id": b.id,
                "guest_name": b.guest_name,
                "guest_email": b.guest_email,
                "listing_id": b.listing_id,
                "listing_title": b.listing_title,
                "check_in": b.check_in,
                "check_out": b.check_out,
                "nights": b.nights,
                "status": b.status,
                "subtotal": b.subtotal,
                "service_fee": b.service_fee,
                "total_amount": b.total_amount,
                "cancellation_reason": b.cancellation_reason,
            }
            for b in bookings
        ]
    finally:
        db.close()

    if not bookings_data:
        with st.container(border=True):
            st.info("No bookings found.")
        return

    # Export functionality
    if st.session_state.get("show_export_bookings"):
        df = pd.DataFrame(bookings_data)
        csv = df.to_csv(index=False)
        st.download_button(
            label="Download CSV",
            data=csv,
            file_name="bookings_export.csv",
            mime="text/csv",
            key="download_bookings_csv",
        )
        st.session_state.pop("show_export_bookings", None)

    # Bookings table
    for booking in bookings_data:
        booking_id = booking["id"]
        guest_name = booking["guest_name"]
        listing_title = booking["listing_title"]
        check_in = booking["check_in"]
        check_out = booking["check_out"]
        status = booking["status"]
        total_amount = booking["total_amount"]

        with st.container(border=True):
            col1, col2, col3, col4, col5 = st.columns([2, 2, 1.5, 1.5, 1])

            with col1:
                st.write(f"**{guest_name}**")
                st.caption(f"ID: {booking_id[:8]}...")
            with col2:
                st.write(f"**{listing_title}**")
            with col3:
                st.write(f"{check_in} → {check_out}")
            with col4:
                st.write(f"**PHP {total_amount:,.2f}**")
            with col5:
                status_color = {
                    "confirmed": "🟢",
                    "completed": "🔵",
                    "cancelled": "🔴",
                    "pending": "🟡",
                }.get(status, "⚪")
                st.write(f"{status_color} {status.title()}")

            # Expandable detail section
            with st.expander(f"Details - {booking_id[:8]}"):
                dcol1, dcol2 = st.columns(2)
                with dcol1:
                    st.write(f"**Guest Email:** {booking['guest_email']}")
                    st.write(f"**Listing ID:** {booking['listing_id']}")
                    st.write(f"**Nights:** {booking['nights']}")
                with dcol2:
                    st.write(f"**Subtotal:** PHP {booking['subtotal']:,.2f}")
                    st.write(f"**Service Fee:** PHP {booking['service_fee']:,.2f}")
                    st.write(f"**Total:** PHP {booking['total_amount']:,.2f}")

                if booking["cancellation_reason"]:
                    st.error(f"**Cancellation Reason:** {booking['cancellation_reason']}")

                # Timeline
                st.subheader("Status Timeline")
                _render_booking_timeline(booking_id)

                # Cancel action (only for confirmed/pending)
                if status in ("confirmed", "pending"):
                    st.divider()
                    if st.button("Cancel Booking", type="secondary", key=f"cancel_{booking_id}"):
                        st.session_state[f"show_cancel_form_{booking_id}"] = True

                    if st.session_state.get(f"show_cancel_form_{booking_id}"):
                        reason = st.text_area(
                            "Cancellation reason",
                            key=f"cancel_reason_{booking_id}"
                        )
                        if st.button("Confirm Cancellation", type="primary", key=f"confirm_cancel_{booking_id}"):
                            if not reason:
                                st.error("Please provide a reason.")
                            else:
                                result = host_api.cancel_booking(booking_id, reason=reason)
                                if result:
                                    db = SessionLocal()
                                    try:
                                        log_action(
                                            db, st.session_state.admin_id,
                                            "cancel_booking", "booking", booking_id, reason
                                        )
                                        # Update cache
                                        cached = db.query(BookingCache).filter(BookingCache.id == booking_id).first()
                                        if cached:
                                            cached.status = "cancelled"
                                            cached.cancellation_reason = reason
                                            db.commit()
                                    finally:
                                        db.close()
                                    st.success("Booking cancelled.")
                                    st.session_state.pop(f"show_cancel_form_{booking_id}", None)
                                    st.rerun()
                                else:
                                    st.error("Failed to cancel booking.")

    # Pagination
    if total > PER_PAGE:
        total_pages = (total + PER_PAGE - 1) // PER_PAGE
        st.divider()
        prev_col, info_col, next_col = st.columns([1, 2, 1])
        with prev_col:
            if st.button("Prev", disabled=page <= 1, key="bookings_prev"):
                st.session_state.bookings_page = page - 1
                st.rerun()
        with info_col:
            st.caption(f"Page {page} of {total_pages}")
        with next_col:
            if st.button("Next", disabled=page >= total_pages, key="bookings_next"):
                st.session_state.bookings_page = page + 1
                st.rerun()
