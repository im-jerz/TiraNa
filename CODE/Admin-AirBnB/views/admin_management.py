import streamlit as st
from sqlalchemy import desc

from database import SessionLocal
from models.admin_user import AdminUser
from services.audit_service import log_action, get_audit_logs
from views.components.sidebar import render_sidebar
from views.components.master_detail import render_master_detail
from utils.icons import user_icon, search_icon, svg_icon
from utils.auth import require_admin
from utils.constants import PAGE_SIZE


def _render_admin_detail(admin_id: str) -> None:
    db = SessionLocal()
    try:
        target_admin = db.query(AdminUser).filter(AdminUser.id == admin_id).first()
        if not target_admin:
            st.warning("Admin not found.")
            return

        st.subheader(target_admin.full_name)
        st.write(f"**Email:** {target_admin.email}")
        st.write(f"**Status:** {'Active' if target_admin.is_active else 'Inactive'}")
        st.write(f"**Created:** {target_admin.created_at}")
        st.write(f"**Last Login:** {target_admin.last_login or 'Never'}")

        st.divider()

        # Toggle active status
        current_admin_id = st.session_state.get("admin_id", "")
        if admin_id != current_admin_id:
            if target_admin.is_active:
                if st.button("Deactivate Admin", type="secondary", key=f"deactivate_{admin_id}"):
                    target_admin.is_active = False
                    db.commit()
                    log_action(
                        db, current_admin_id,
                        "deactivate_admin", "admin_user", admin_id
                    )
                    st.success(f"Admin {target_admin.full_name} deactivated.")
                    st.rerun()
            else:
                if st.button("Reactivate Admin", type="primary", key=f"reactivate_{admin_id}"):
                    target_admin.is_active = True
                    db.commit()
                    log_action(
                        db, current_admin_id,
                        "reactivate_admin", "admin_user", admin_id
                    )
                    st.success(f"Admin {target_admin.full_name} reactivated.")
                    st.rerun()
        else:
            st.info("You cannot deactivate your own account.")

        # Activity log for this admin
        st.divider()
        st.subheader("Activity Log")

        logs_data = get_audit_logs(db, admin_id=admin_id, page=1, per_page=10)
        logs = logs_data.get("logs", [])

        if not logs:
            st.info("No activity recorded.")
        else:
            for log in logs:
                with st.container(border=True):
                    st.write(f"**{log.action}** on {log.target_type}")
                    st.caption(f"Target: {log.target_id[:8]}... | {log.created_at}")
                    if log.details:
                        st.caption(f"Details: {log.details}")
    finally:
        db.close()


@require_admin
def render(*, admin):
    render_sidebar(admin)
    st.title("Admin Management")

    # Create new admin
    with st.expander("Create New Admin"):
        with st.form("create_admin_form"):
            new_name = st.text_input("Full Name", help="Your full legal name.")
            new_email = st.text_input("Email", help="Login email address.")
            new_password = st.text_input("Password", type="password", help="Minimum 8 characters.")
            confirm_password = st.text_input("Confirm Password", type="password", help="Must match the password above.")
            submitted = st.form_submit_button("Create Admin")

            if submitted:
                if not new_name or not new_email or not new_password:
                    st.error("All fields are required.")
                elif new_password != confirm_password:
                    st.error("Passwords do not match.")
                elif len(new_password) < 8:
                    st.error("Password must be at least 8 characters.")
                else:
                    from services.auth_service import register_admin
                    db_create = SessionLocal()
                    try:
                        admin_id, error = register_admin(db_create, new_email, new_password, new_name)
                        if admin_id:
                            log_action(
                                db_create, st.session_state.admin_id,
                                "create_admin", "admin_user", admin_id,
                                f"Created admin: {new_email}"
                            )
                            st.success(f"Admin {new_name} created successfully.")
                            st.rerun()
                        else:
                            st.error(error or "Failed to create admin. Email may already exist.")
                    finally:
                        db_create.close()

    st.divider()

    # List admins
    page = st.session_state.get("admins_page", 1)
    search = st.text_input(
        "Search by name or email",
        label_visibility="collapsed",
        key="admin_search",
        placeholder="Search admins...",
        help="Search by name or email.",
    )

    with st.spinner("Loading admins…"):
        db_list = SessionLocal()
        try:
            query = db_list.query(AdminUser)
            if search:
                query = query.filter(
                    (AdminUser.full_name.ilike(f"%{search}%")) |
                    (AdminUser.email.ilike(f"%{search}%"))
                )
            total = query.count()
            admins = query.order_by(AdminUser.created_at.desc()).offset((page - 1) * PAGE_SIZE).limit(PAGE_SIZE).all()

            items = [
                {
                    "id": a.id,
                    "full_name": a.full_name,
                    "email": a.email,
                    "is_active": a.is_active,
                }
                for a in admins
            ]
        finally:
            db_list.close()

    render_master_detail(
        items=items,
        selection_key="selected_admin_id",
        render_detail=_render_admin_detail,
        title=f"{svg_icon(user_icon())} Admins ({total})",
        detail_title=f"{svg_icon(search_icon())} Admin Details",
        label_fields=("full_name", "email"),
        no_items_message="No admins found.",
        total=total,
        page=page,
        per_page=PAGE_SIZE,
        page_state_key="admins_page",
    )
