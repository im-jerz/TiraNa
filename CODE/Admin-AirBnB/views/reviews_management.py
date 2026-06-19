import streamlit as st
from sqlalchemy import desc

from database import SessionLocal
from models.review_copy import ReviewCache
from services.host_api import host_api
from services.audit_service import log_action
from services.sync_service import sync_reviews
from services.auth_service import get_admin_by_id
from views.components.sidebar import render_sidebar
from views.components.master_detail import render_master_detail


PER_PAGE = 20


def _render_review_detail(review_id: str) -> None:
    db = SessionLocal()
    try:
        review = db.query(ReviewCache).filter(ReviewCache.id == review_id).first()
        if not review:
            with st.container(border=True):
                st.warning("Could not load review details.")
            return

        st.subheader(f"Review by {review.guest_name}")

        st.write(f"**Rating:** {'⭐' * review.rating} ({review.rating}/5)")
        st.write(f"**Listing ID:** {review.listing_id}")
        st.write(f"**Guest:** {review.guest_name} ({review.guest_email})")
        st.write(f"**Date:** {review.created_at}")
        st.write(f"**Status:** {'Hidden' if review.is_hidden else 'Visible'}")

        st.divider()
        st.subheader("Review Text")
        st.write(review.text or "No review text provided.")

        st.divider()

        if review.is_hidden:
            if st.button("Show Review", type="primary", key="show_review"):
                result = host_api.show_review(review_id)
                if result:
                    review.is_hidden = False
                    db.commit()
                    log_action(
                        db, st.session_state.admin_id,
                        "show_review", "review", review_id
                    )
                    st.success("Review is now visible.")
                    st.rerun()
                else:
                    st.error("Failed to show review.")
        else:
            if st.button("Hide Review", type="secondary", key="hide_review"):
                st.session_state.show_hide_review_form = review_id

            if st.session_state.get("show_hide_review_form") == review_id:
                reason = st.text_area("Reason for hiding", key="hide_review_reason")
                if st.button("Confirm Hide", type="primary", key="confirm_hide_review"):
                    if not reason:
                        st.error("Please provide a reason.")
                    else:
                        result = host_api.hide_review(review_id)
                        if result:
                            review.is_hidden = True
                            db.commit()
                            log_action(
                                db, st.session_state.admin_id,
                                "hide_review", "review", review_id, reason
                            )
                            st.success("Review hidden.")
                            st.session_state.pop("show_hide_review_form", None)
                            st.rerun()
                        else:
                            st.error("Failed to hide review.")
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
    st.title("Reviews Management")

    # Sync from Host API
    db = SessionLocal()
    try:
        sync_reviews(db)
    finally:
        db.close()

    search = st.text_input(
        "Filter by listing ID",
        label_visibility="collapsed",
        key="review_listing_filter",
        placeholder="Filter by listing ID...",
    )

    st.write("")

    page = st.session_state.get("reviews_page", 1)

    # Query from cache
    db = SessionLocal()
    try:
        query = db.query(ReviewCache)
        if search:
            query = query.filter(ReviewCache.listing_id == search)
        total = query.count()
        reviews = query.order_by(desc(ReviewCache.created_at)).offset((page - 1) * PER_PAGE).limit(PER_PAGE).all()
        items = [
            {
                "id": r.id,
                "listing_id": r.listing_id,
                "guest_name": r.guest_name,
                "guest_email": r.guest_email,
                "rating": r.rating,
                "text": r.text,
                "is_hidden": r.is_hidden,
                "created_at": r.created_at,
            }
            for r in reviews
        ]
    finally:
        db.close()

    render_master_detail(
        items=items,
        selection_key="selected_review_id",
        render_detail=_render_review_detail,
        title=f"📝 Reviews ({total})",
        detail_title="🔍 Review Details",
        id_field="id",
        label_fields=("guest_name",),
        no_items_message="No reviews found.",
        error_message="Could not load reviews.",
        total=total,
        page=page,
        per_page=PER_PAGE,
        page_state_key="reviews_page",
    )
