import streamlit as st

from database import SessionLocal
from services.host_api import host_api
from services.audit_service import log_action
from services.auth_service import get_admin_by_id
from views.components.sidebar import render_sidebar
from views.components.master_detail import render_master_detail
from utils.icons import house_icon, search_icon, svg_icon


PER_PAGE = 20

STATUS_OPTIONS = ["", "pending", "approved", "suspended", "rejected"]
STATUS_LABELS = ["All Statuses", "Pending", "Approved", "Suspended", "Rejected"]


def _render_listing_detail(listing_id: str) -> None:
    listing = host_api.get_listing(listing_id)
    if not listing:
        with st.container(border=True):
            st.warning("Could not load listing details.")
        return

    st.subheader(listing.get("title", "Untitled Listing"))
    st.write(f"**Host:** {listing.get('host_name', '-')} ({listing.get('host_email', '-')})")
    st.write(f"**Price:** PHP {listing.get('price_per_night', 0):,.2f} / night")
    st.write(f"**Max Guests:** {listing.get('max_guests', '-')}")
    st.write(f"**Status:** {listing.get('status', '-')}")
    st.write(f"**Created:** {listing.get('created_at', '-')}")

    description = listing.get("description", "")
    if description:
        st.divider()
        st.subheader("Description")
        st.write(description)

    photos = listing.get("photos", [])
    if photos:
        st.divider()
        st.subheader("Photos")
        cols = st.columns(min(len(photos), 3))
        for i, photo_url in enumerate(photos[:6]):
            with cols[i % 3]:
                st.image(photo_url, use_container_width=True)

    amenities = listing.get("amenities", [])
    if amenities:
        st.divider()
        st.subheader("Amenities")
        st.write(", ".join(amenities))

    st.divider()

    status = listing.get("status", "")
    if status in ("pending", "rejected"):
        col1, col2 = st.columns(2)
        with col1:
            if st.button("Approve Listing", type="primary", key="approve_listing"):
                result = host_api.approve_listing(listing_id)
                if result:
                    db = SessionLocal()
                    try:
                        log_action(
                            db, st.session_state.admin_id,
                            "approve_listing", "listing", listing_id
                        )
                    finally:
                        db.close()
                    st.success("Listing approved.")
                    st.rerun()
                else:
                    st.error("Failed to approve listing.")

        with col2:
            if st.button("Reject Listing", type="secondary", key="reject_listing"):
                st.session_state.show_reject_listing_form = listing_id

        if st.session_state.get("show_reject_listing_form") == listing_id:
            reason = st.text_area("Rejection reason", key="reject_listing_reason")
            if st.button("Confirm Rejection", type="primary", key="confirm_reject_listing"):
                if not reason:
                    st.error("Please provide a reason.")
                else:
                    result = host_api.reject_listing(listing_id, reason=reason)
                    if result:
                        db = SessionLocal()
                        try:
                            log_action(
                                db, st.session_state.admin_id,
                                "reject_listing", "listing", listing_id, reason
                            )
                        finally:
                            db.close()
                        st.success("Listing rejected.")
                        st.session_state.pop("show_reject_listing_form", None)
                        st.rerun()
                    else:
                        st.error("Failed to reject listing.")

    elif status == "approved":
        if st.button("Suspend Listing", type="secondary", key="suspend_listing"):
            st.session_state.show_suspend_listing_form = listing_id

        if st.session_state.get("show_suspend_listing_form") == listing_id:
            reason = st.text_area("Suspension reason", key="suspend_listing_reason")
            if st.button("Confirm Suspension", type="primary", key="confirm_suspend_listing"):
                if not reason:
                    st.error("Please provide a reason.")
                else:
                    result = host_api.suspend_listing(listing_id, reason=reason)
                    if result:
                        db = SessionLocal()
                        try:
                            log_action(
                                db, st.session_state.admin_id,
                                "suspend_listing", "listing", listing_id, reason
                            )
                        finally:
                            db.close()
                        st.success("Listing suspended.")
                        st.session_state.pop("show_suspend_listing_form", None)
                        st.rerun()
                    else:
                        st.error("Failed to suspend listing.")
    else:
        with st.container(border=True):
            st.info(f"This listing is currently {status}.")


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
    st.title("Listings Moderation")

    col1, col2 = st.columns([1, 3])
    with col1:
        status_idx = st.selectbox(
            "Status",
            STATUS_OPTIONS,
            format_func=lambda x: STATUS_LABELS[STATUS_OPTIONS.index(x)],
            label_visibility="collapsed",
            key="listing_status_filter",
        )
    with col2:
        search = st.text_input(
            "Search by listing title",
            label_visibility="collapsed",
            key="listing_search",
            placeholder="Search listings...",
        )

    st.write("")

    page = st.session_state.get("listings_page", 1)
    status_filter = status_idx

    data = host_api.get_listings(
        status=status_filter,
        search=search,
        page=page,
        per_page=PER_PAGE,
    )

    items = data.get("listings") if data else None
    total = data.get("total", 0) if data else 0

    render_master_detail(
        items=items,
        selection_key="selected_listing_id",
        render_detail=_render_listing_detail,
        title=f"{svg_icon(house_icon())} Listings ({total})",
        detail_title=f"{svg_icon(search_icon())} Listing Details",
        id_field="id",
        label_fields=("title",),
        no_items_message="No listings found.",
        error_message="Could not load listings. Host API may be unavailable.",
        total=total,
        page=page,
        per_page=PER_PAGE,
        page_state_key="listings_page",
    )
