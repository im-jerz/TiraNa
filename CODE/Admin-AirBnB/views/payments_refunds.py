import streamlit as st
import pandas as pd
from sqlalchemy import desc

from database import SessionLocal
from models.payment_copy import PaymentCache
from services.host_api import host_api
from services.audit_service import log_action
from services.sync_service import sync_payments
from views.components.sidebar import render_sidebar
from utils.icons import check_circle_icon, clock_icon, x_circle_icon, dot_icon, svg_icon
from utils.auth import require_admin
from utils.constants import PAGE_SIZE


def _render_withdrawals():
    st.subheader("Withdrawal Requests")

    data = host_api.get_withdrawals(page=1, per_page=100)
    withdrawals = data.get("withdrawals") if data else None

    if withdrawals is None:
        st.warning("Could not load withdrawals. Host API may be unavailable.")
        return

    if not withdrawals:
        st.info("No withdrawal requests found.")
        return

    for w in withdrawals:
        withdrawal_id = w.get("id", "")
        host_name = w.get("host_name", "Unknown")
        amount = w.get("amount", 0)
        status = w.get("status", "-")
        requested_at = w.get("requested_at", "-")

        with st.container(border=True):
            col1, col2, col3, col4 = st.columns([2, 1.5, 1.5, 1.5])

            with col1:
                st.write(f"**{host_name}**")
                st.caption(f"ID: {withdrawal_id[:8]}...")
            with col2:
                st.write(f"**PHP {amount:,.2f}**")
            with col3:
                st.write(f"Requested: {requested_at}")
            with col4:
                if status == "pending":
                    a1, a2 = st.columns(2)
                    with a1:
                        if st.button("Approve", type="primary", key=f"approve_w_{withdrawal_id}"):
                            result = host_api.approve_withdrawal(withdrawal_id)
                            if result:
                                db = SessionLocal()
                                try:
                                    log_action(
                                        db, st.session_state.admin_id,
                                        "approve_withdrawal", "withdrawal", withdrawal_id
                                    )
                                finally:
                                    db.close()
                                st.success(f"Withdrawal approved for {host_name}.")
                                st.rerun()
                            else:
                                st.error("Failed to approve withdrawal.")
                    with a2:
                        if st.button("Reject", type="secondary", key=f"reject_w_{withdrawal_id}"):
                            st.session_state[f"show_reject_w_{withdrawal_id}"] = True
                else:
                    st.write(f"**{status.title()}**")

            if st.session_state.get(f"show_reject_w_{withdrawal_id}"):
                reason = st.text_area("Rejection reason", key=f"reject_w_reason_{withdrawal_id}")
                if st.button("Confirm Rejection", type="primary", key=f"confirm_reject_w_{withdrawal_id}"):
                    if not reason:
                        st.error("Please provide a reason.")
                    else:
                        result = host_api.reject_withdrawal(withdrawal_id, reason=reason)
                        if result:
                            db = SessionLocal()
                            try:
                                log_action(
                                    db, st.session_state.admin_id,
                                    "reject_withdrawal", "withdrawal", withdrawal_id, reason
                                )
                            finally:
                                db.close()
                            st.success(f"Withdrawal rejected for {host_name}.")
                            st.session_state.pop(f"show_reject_w_{withdrawal_id}", None)
                            st.rerun()
                        else:
                            st.error("Failed to reject withdrawal.")


@require_admin
def render(*, admin):
    render_sidebar(admin)
    st.title("Payments & Refunds")

    # Sync from Host API
    with st.spinner("Syncing payments from Host API..."):
        db = SessionLocal()
        try:
            sync_payments(db)
        finally:
            db.close()

    # KPI cards (from cache)
    db = SessionLocal()
    try:
        total_revenue = db.query(PaymentCache).filter(PaymentCache.status == "completed").count()
        total_amount = db.query(PaymentCache.amount).filter(PaymentCache.status == "completed").all()
        revenue_sum = sum(a[0] for a in total_amount) if total_amount else 0
    finally:
        db.close()

    c1, c2 = st.columns(2)
    c1.metric("Total Revenue", f"PHP {revenue_sum:,.2f}")
    c2.metric("Total Payments", f"{total_revenue:,}")

    st.divider()

    # Tabs for Payments and Withdrawals
    tab_payments, tab_withdrawals = st.tabs(["Payments", "Withdrawals"])

    with tab_payments:
        page = st.session_state.get("payments_page", 1)

        # Query from cache
        db = SessionLocal()
        try:
            total = db.query(PaymentCache).count()
            payments = db.query(PaymentCache).order_by(desc(PaymentCache.created_at)).offset((page - 1) * PAGE_SIZE).limit(PAGE_SIZE).all()
            payments_data = [
                {
                    "id": p.id,
                    "booking_id": p.booking_id,
                    "guest_id": p.guest_id,
                    "guest_name": p.guest_name,
                    "guest_email": p.guest_email,
                    "amount": p.amount,
                    "method": p.method,
                    "status": p.status,
                    "refund_amount": p.refund_amount,
                    "refund_reason": p.refund_reason,
                    "created_at": p.created_at,
                }
                for p in payments
            ]
        finally:
            db.close()

        if not payments_data:
            with st.container(border=True):
                st.info("No payments found.")
            return

        # Export
        if st.button("Export CSV", key="export_payments"):
            df = pd.DataFrame(payments_data)
            csv = df.to_csv(index=False)
            st.download_button(
                label="Download CSV",
                data=csv,
                file_name="payments_export.csv",
                mime="text/csv",
                key="download_payments_csv",
            )

        # Payments table
        for payment in payments_data:
            payment_id = payment["id"]
            booking_id = payment["booking_id"]
            guest_name = payment["guest_name"]
            amount = payment["amount"]
            method = payment["method"]
            status = payment["status"]
            created_at = payment["created_at"]

            with st.container(border=True):
                col1, col2, col3, col4, col5 = st.columns([2, 1.5, 1, 1, 1.5])

                with col1:
                    st.write(f"**{guest_name}**")
                    st.caption(f"Payment: {payment_id[:8]}...")
                with col2:
                    st.caption(f"Booking: {booking_id[:8]}...")
                with col3:
                    st.write(f"**PHP {amount:,.2f}**")
                with col4:
                    st.write(f"{method}")
                with col5:
                    status_icon = {
                        "completed": svg_icon(check_circle_icon(color="#16a34a")),
                        "refunded": svg_icon(clock_icon(color="#d97706")),
                        "failed": svg_icon(x_circle_icon(color="#dc2626")),
                    }.get(status, svg_icon(dot_icon(color="#9ca3af")))
                    st.markdown(f"{status_icon} {status.title()}", unsafe_allow_html=True)

                # Expand for detail + refund
                with st.expander(f"Details - {payment_id[:8]}"):
                    st.write(f"**Created:** {created_at}")
                    st.write(f"**Booking ID:** {booking_id}")
                    st.write(f"**Guest:** {guest_name} ({payment['guest_email']})")

                    if payment["refund_amount"]:
                        st.warning(f"**Refunded:** PHP {payment['refund_amount']:,.2f}")
                        st.write(f"**Refund Reason:** {payment['refund_reason']}")

                    if status == "completed":
                        st.divider()
                        if st.button("Process Refund", type="secondary", key=f"refund_{payment_id}"):
                            st.session_state[f"show_refund_form_{payment_id}"] = True

                        if st.session_state.get(f"show_refund_form_{payment_id}"):
                            refund_amount = st.number_input(
                                "Refund amount (PHP)",
                                min_value=0.0,
                                max_value=float(amount),
                                value=float(amount),
                                key=f"refund_amount_{payment_id}",
                            )
                            reason = st.text_area("Refund reason", key=f"refund_reason_{payment_id}")
                            if st.button("Confirm Refund", type="primary", key=f"confirm_refund_{payment_id}"):
                                if not reason:
                                    st.error("Please provide a reason.")
                                else:
                                    result = host_api.process_refund(payment_id, refund_amount, reason)
                                    if result:
                                        db = SessionLocal()
                                        try:
                                            log_action(
                                                db, st.session_state.admin_id,
                                                "process_refund", "payment", payment_id,
                                                f"Amount: PHP {refund_amount:,.2f}. Reason: {reason}"
                                            )
                                            # Update cache
                                            cached = db.query(PaymentCache).filter(PaymentCache.id == payment_id).first()
                                            if cached:
                                                cached.status = "refunded"
                                                cached.refund_amount = refund_amount
                                                cached.refund_reason = reason
                                                db.commit()
                                        finally:
                                            db.close()
                                        st.success("Refund processed.")
                                        st.session_state.pop(f"show_refund_form_{payment_id}", None)
                                        st.rerun()
                                    else:
                                        st.error("Failed to process refund.")

        # Pagination
        if total > PAGE_SIZE:
            total_pages = (total + PAGE_SIZE - 1) // PAGE_SIZE
            st.divider()
            prev_col, info_col, next_col = st.columns([1, 2, 1])
            with prev_col:
                if st.button("Prev", disabled=page <= 1, key="payments_prev"):
                    st.session_state.payments_page = page - 1
                    st.rerun()
            with info_col:
                st.caption(f"Page {page} of {total_pages}")
            with next_col:
                if st.button("Next", disabled=page >= total_pages, key="payments_next"):
                    st.session_state.payments_page = page + 1
                    st.rerun()

    with tab_withdrawals:
        _render_withdrawals()
