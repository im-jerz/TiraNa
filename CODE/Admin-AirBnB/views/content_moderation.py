import streamlit as st
from sqlalchemy import desc

from database import SessionLocal
from services.host_api import host_api
from services.audit_service import log_action, get_audit_logs
from views.components.sidebar import render_sidebar
from utils.auth import require_admin
from utils.constants import PAGE_SIZE


def _render_moderation_log():
    st.subheader("Moderation Action Log")
    db = SessionLocal()
    try:
        data = get_audit_logs(db, target_type="moderation", page=1, per_page=50)
        logs = data.get("logs", [])
        if not logs:
            st.info("No moderation actions recorded yet.")
            return
        for log in logs:
            with st.container(border=True):
                col1, col2 = st.columns([3, 1])
                with col1:
                    st.write(f"**{log.action}** on {log.target_type}/{log.target_id[:8]}...")
                    if log.details:
                        st.caption(log.details)
                with col2:
                    st.caption(str(log.created_at))
    finally:
        db.close()


def _render_reported_listings():
    st.subheader("Reported Listings")
    data = host_api.get_listings(status="reported", page=1, per_page=100)
    listings = data.get("listings") if data else None

    if listings is None:
        st.warning("Could not load reported listings. Host API may be unavailable.")
        return

    reported = [l for l in listings if l.get("report_count", 0) > 0] if listings else []

    if not reported:
        st.info("No reported listings.")
        return

    for listing in reported:
        listing_id = listing.get("id", "")
        title = listing.get("title", "Untitled")
        report_count = listing.get("report_count", 0)
        host_name = listing.get("host_name", "Unknown")

        with st.container(border=True):
            col1, col2, col3 = st.columns([3, 1, 2])
            with col1:
                st.write(f"**{title}**")
                st.caption(f"Host: {host_name}")
            with col2:
                st.warning(f"{report_count} report(s)")
            with col3:
                a1, a2, a3 = st.columns(3)
                with a1:
                    if st.button("Review", key=f"review_{listing_id}"):
                        st.session_state[f"show_listing_detail_{listing_id}"] = True
                with a2:
                    if st.button("Suspend", type="secondary", key=f"suspend_mod_{listing_id}"):
                        st.session_state[f"show_suspend_mod_{listing_id}"] = True
                with a3:
                    if st.button("Dismiss", key=f"dismiss_{listing_id}"):
                        db = SessionLocal()
                        try:
                            log_action(
                                db, st.session_state.admin_id,
                                "dismiss_report", "moderation", listing_id,
                                f"Dismissed {report_count} reports"
                            )
                        finally:
                            db.close()
                        st.success("Report dismissed.")
                        st.rerun()

            if st.session_state.get(f"show_suspend_mod_{listing_id}"):
                reason = st.text_area("Suspension reason", key=f"mod_suspend_reason_{listing_id}")
                if st.button("Confirm Suspension", type="primary", key=f"confirm_mod_suspend_{listing_id}"):
                    if not reason:
                        st.error("Please provide a reason.")
                    else:
                        result = host_api.suspend_listing(listing_id, reason=reason)
                        if result:
                            db = SessionLocal()
                            try:
                                log_action(
                                    db, st.session_state.admin_id,
                                    "suspend_listing", "moderation", listing_id,
                                    f"Suspended due to reports: {reason}"
                                )
                            finally:
                                db.close()
                            st.success("Listing suspended.")
                            st.session_state.pop(f"show_suspend_mod_{listing_id}", None)
                            st.rerun()
                        else:
                            st.error("Failed to suspend listing.")

            if st.session_state.get(f"show_listing_detail_{listing_id}"):
                listing_detail = host_api.get_listing(listing_id)
                if listing_detail:
                    st.divider()
                    st.write(f"**Description:** {listing_detail.get('description', '-')}")
                    st.write(f"**Price:** PHP {listing_detail.get('price_per_night', 0):,.2f}/night")
                    st.write(f"**Status:** {listing_detail.get('status', '-')}")
                    photos = listing_detail.get("photos", [])
                    if photos:
                        cols = st.columns(min(len(photos), 3))
                        for i, photo_url in enumerate(photos[:3]):
                            with cols[i]:
                                st.image(photo_url, use_container_width=True)
                st.session_state.pop(f"show_listing_detail_{listing_id}", None)


def _render_flagged_content():
    st.subheader("Flagged Reviews")
    data = host_api.get_reviews(page=1, per_page=100)
    reviews = data.get("reviews") if data else None

    if reviews is None:
        st.warning("Could not load reviews. Host API may be unavailable.")
        return

    flagged = [r for r in reviews if r.get("is_flagged", False)] if reviews else []

    if not flagged:
        st.info("No flagged reviews.")
        return

    for review in flagged:
        review_id = review.get("id", "")
        guest_name = review.get("guest_name", "Unknown")
        rating = review.get("rating", 0)
        text = review.get("text", "")

        with st.container(border=True):
            col1, col2 = st.columns([3, 1])
            with col1:
                st.write(f"**{guest_name}** — {'⭐' * rating}")
                st.write(text)
            with col2:
                a1, a2 = st.columns(2)
                with a1:
                    if st.button("Hide", type="secondary", key=f"hide_review_{review_id}"):
                        result = host_api.hide_review(review_id)
                        if result:
                            db = SessionLocal()
                            try:
                                log_action(
                                    db, st.session_state.admin_id,
                                    "hide_review", "moderation", review_id,
                                    f"Hidden flagged review by {guest_name}"
                                )
                            finally:
                                db.close()
                            st.success("Review hidden.")
                            st.rerun()
                        else:
                            st.error("Failed to hide review.")
                with a2:
                    if st.button("Dismiss", key=f"dismiss_review_{review_id}"):
                        db = SessionLocal()
                        try:
                            log_action(
                                db, st.session_state.admin_id,
                                "dismiss_flag", "moderation", review_id,
                                f"Dismissed flag on review by {guest_name}"
                            )
                        finally:
                            db.close()
                        st.success("Flag dismissed.")
                        st.rerun()


@require_admin
def render(*, admin):
    render_sidebar(admin)
    st.title("Content Moderation")

    tab_reported, tab_flagged, tab_log = st.tabs([
        "Reported Listings", "Flagged Content", "Moderation Log"
    ])

    with tab_reported:
        _render_reported_listings()

    with tab_flagged:
        _render_flagged_content()

    with tab_log:
        _render_moderation_log()
