import streamlit as st


NAV_ITEMS = [
    ("Dashboard", "dashboard"),
    ("Listings", "listings_moderation"),
    ("Bookings", "bookings_management"),
    ("Payments", "payments_refunds"),
    ("Reviews", "reviews_management"),
    ("Users", "user_management"),
    ("Hosts", "host_management"),
    ("Host Verification", "host_verification"),
    ("Support", "support_tickets"),
    ("Disputes", "disputes"),
    ("Admins", "admin_management"),
    ("Settings", "settings"),
]


def render_sidebar(admin) -> None:
    """Render the shared admin sidebar with profile + navigation + logout.

    Reads/writes `st.session_state.page` — the same key `app.py` uses to
    route between views — so a click here actually navigates.

    The active page is highlighted (primary button style) so the admin
    always knows where they are.
    """
    with st.sidebar:
        st.markdown(f"### 👤 {admin.full_name}")
        st.caption(admin.email)
        st.divider()

        st.markdown("### 🧭 Navigation")

        current_page = st.session_state.get("page", "")
        for label, page_value in NAV_ITEMS:
            is_active = current_page == page_value
            if st.button(
                label,
                key=f"nav_{page_value}",
                use_container_width=True,
                type="primary" if is_active else "secondary",
            ):
                st.session_state.page = page_value
                st.rerun()

        st.divider()
        if st.button("Logout", key="nav_logout", use_container_width=True):
            for key in list(st.session_state.keys()):
                del st.session_state[key]
            st.session_state.page = "sign_in"
            st.rerun()
