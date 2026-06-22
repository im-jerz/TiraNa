import functools
import streamlit as st

from database import SessionLocal
from services.auth_service import get_admin_by_id


def require_admin(render_func):
    @functools.wraps(render_func)
    def wrapper(*args, **kwargs):
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

        return render_func(*args, admin=admin, **kwargs)
    return wrapper
