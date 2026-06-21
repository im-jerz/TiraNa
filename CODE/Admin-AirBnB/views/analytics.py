import streamlit as st
import plotly.express as px
import plotly.graph_objects as go
import pandas as pd
from sqlalchemy import desc, func

from database import SessionLocal
from models.booking_copy import BookingCache
from models.payment_copy import PaymentCache
from models.review_copy import ReviewCache
from models.dispute import Dispute
from models.support_ticket import SupportTicket
from models.audit_log import AuditLog
from services.host_api import host_api
from views.components.sidebar import render_sidebar
from utils.auth import require_admin


def _render_overview():
    st.subheader("Platform Overview")

    db = SessionLocal()
    try:
        total_bookings = db.query(BookingCache).count()
        completed_bookings = db.query(BookingCache).filter(BookingCache.status == "completed").count()
        cancelled_bookings = db.query(BookingCache).filter(BookingCache.status == "cancelled").count()

        total_revenue = db.query(func.sum(PaymentCache.amount)).filter(PaymentCache.status == "completed").scalar() or 0
        total_payments = db.query(PaymentCache).filter(PaymentCache.status == "completed").count()
        total_refunds = db.query(func.sum(PaymentCache.refund_amount)).filter(PaymentCache.refund_amount.isnot(None)).scalar() or 0

        avg_booking_value = total_revenue / completed_bookings if completed_bookings > 0 else 0
    finally:
        db.close()

    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Gross Booking Value", f"₱{total_revenue:,.2f}")
    c2.metric("Total Bookings", f"{total_bookings:,}")
    c3.metric("Avg Booking Value", f"₱{avg_booking_value:,.2f}")
    c4.metric("Total Refunds", f"₱{total_refunds:,.2f}")

    st.divider()

    col1, col2 = st.columns(2)
    with col1:
        st.subheader("Booking Status Distribution")
        if total_bookings > 0:
            status_data = pd.DataFrame({
                "Status": ["Completed", "Cancelled", "Other"],
                "Count": [completed_bookings, cancelled_bookings, total_bookings - completed_bookings - cancelled_bookings]
            })
            fig = px.pie(status_data, names="Status", values="Count", color_discrete_sequence=["#6B8F5E", "#dc2626", "#D4943E"])
            fig.update_layout(margin=dict(t=10, b=10, l=10, r=10), height=300)
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("No booking data available.")

    with col2:
        st.subheader("Revenue by Payment Method")
        db = SessionLocal()
        try:
            method_data = db.query(
                PaymentCache.method, func.sum(PaymentCache.amount)
            ).filter(PaymentCache.status == "completed").group_by(PaymentCache.method).all()
        finally:
            db.close()

        if method_data:
            df = pd.DataFrame(method_data, columns=["Method", "Revenue"])
            fig = px.bar(df, x="Method", y="Revenue", color="Method", color_discrete_sequence=["#7B1E3A", "#D4943E", "#6B8F5E"])
            fig.update_layout(margin=dict(t=10, b=10, l=10, r=10), height=300, showlegend=False)
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("No payment data available.")


def _render_booking_insights():
    st.subheader("Booking Insights")

    db = SessionLocal()
    try:
        total = db.query(BookingCache).count()
        if total == 0:
            st.info("No booking data available for insights.")
            return

        avg_nights = db.query(func.avg(BookingCache.nights)).scalar() or 0
        cancellation_rate = (db.query(BookingCache).filter(BookingCache.status == "cancelled").count() / total * 100) if total > 0 else 0
        total_revenue = db.query(func.sum(BookingCache.total_amount)).scalar() or 0

        c1, c2, c3 = st.columns(3)
        c1.metric("Avg Nights per Booking", f"{avg_nights:.1f}")
        c2.metric("Cancellation Rate", f"{cancellation_rate:.1f}%")
        c3.metric("Total Booking Value", f"₱{total_revenue:,.2f}")

        st.divider()

        st.subheader("Bookings by Month")
        bookings = db.query(BookingCache.created_at).all()
        if bookings:
            df = pd.DataFrame([(b[0].strftime("%Y-%m") if b[0] else "Unknown") for b in bookings], columns=["Month"])
            monthly = df.groupby("Month").size().reset_index(name="Count").sort_values("Month")
            fig = px.bar(monthly, x="Month", y="Count", color_discrete_sequence=["#7B1E3A"])
            fig.update_layout(margin=dict(t=10, b=10, l=10, r=10), height=300)
            st.plotly_chart(fig, use_container_width=True)
    finally:
        db.close()


def _render_user_activity():
    st.subheader("User Activity")

    db = SessionLocal()
    try:
        total_support_tickets = db.query(SupportTicket).count()
        open_tickets = db.query(SupportTicket).filter(SupportTicket.status == "open").count()
        total_disputes = db.query(Dispute).count()
        open_disputes = db.query(Dispute).filter(Dispute.status == "open").count()
        total_admin_actions = db.query(AuditLog).count()
    finally:
        db.close()

    c1, c2, c3 = st.columns(3)
    c1.metric("Total Support Tickets", f"{total_support_tickets:,}", f"{open_tickets} open")
    c2.metric("Total Disputes", f"{total_disputes:,}", f"{open_disputes} open")
    c3.metric("Total Admin Actions", f"{total_admin_actions:,}")

    st.divider()

    col1, col2 = st.columns(2)
    with col1:
        st.subheader("Ticket Status")
        db = SessionLocal()
        try:
            ticket_status = db.query(
                SupportTicket.status, func.count(SupportTicket.id)
            ).group_by(SupportTicket.status).all()
        finally:
            db.close()

        if ticket_status:
            df = pd.DataFrame(ticket_status, columns=["Status", "Count"])
            fig = px.pie(df, names="Status", values="Count", color_discrete_sequence=["#D4943E", "#6B8F5E", "#dc2626"])
            fig.update_layout(margin=dict(t=10, b=10, l=10, r=10), height=300)
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("No ticket data.")

    with col2:
        st.subheader("Dispute Status")
        db = SessionLocal()
        try:
            dispute_status = db.query(
                Dispute.status, func.count(Dispute.id)
            ).group_by(Dispute.status).all()
        finally:
            db.close()

        if dispute_status:
            df = pd.DataFrame(dispute_status, columns=["Status", "Count"])
            fig = px.pie(df, names="Status", values="Count", color_discrete_sequence=["#D4943E", "#6B8F5E", "#dc2626", "#9ca3af"])
            fig.update_layout(margin=dict(t=10, b=10, l=10, r=10), height=300)
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("No dispute data.")


def _render_reports():
    st.subheader("Exportable Reports")

    report_type = st.selectbox(
        "Select Report",
        ["Platform Performance", "Booking Insights", "User Activity", "Revenue Report"],
        key="report_type"
    )

    db = SessionLocal()
    try:
        if report_type == "Platform Performance":
            st.write("**Platform Performance Report**")
            total_bookings = db.query(BookingCache).count()
            completed = db.query(BookingCache).filter(BookingCache.status == "completed").count()
            total_revenue = db.query(func.sum(PaymentCache.amount)).filter(PaymentCache.status == "completed").scalar() or 0
            unique_guests = db.query(BookingCache.guest_id).distinct().count()

            report_data = pd.DataFrame({
                "Metric": ["Total Bookings", "Completed Bookings", "Completion Rate", "Total Revenue", "Avg Revenue per Booking"],
                "Value": [
                    total_bookings,
                    completed,
                    f"{(completed/total_bookings*100) if total_bookings > 0 else 0:.1f}%",
                    f"₱{total_revenue:,.2f}",
                    f"₱{(total_revenue/completed) if completed > 0 else 0:,.2f}",
                ]
            })

        elif report_type == "Booking Insights":
            st.write("**Booking Insights Report**")
            avg_nights = db.query(func.avg(BookingCache.nights)).scalar() or 0
            cancellation_rate = (db.query(BookingCache).filter(BookingCache.status == "cancelled").count() / db.query(BookingCache).count() * 100) if db.query(BookingCache).count() > 0 else 0
            total_revenue = db.query(func.sum(BookingCache.total_amount)).scalar() or 0

            report_data = pd.DataFrame({
                "Metric": ["Avg Nights", "Cancellation Rate", "Total Booking Value"],
                "Value": [f"{avg_nights:.1f}", f"{cancellation_rate:.1f}%", f"₱{total_revenue:,.2f}"]
            })

        elif report_type == "User Activity":
            st.write("**User Activity Report**")
            total_tickets = db.query(SupportTicket).count()
            open_tickets = db.query(SupportTicket).filter(SupportTicket.status == "open").count()
            total_disputes = db.query(Dispute).count()
            total_admin_actions = db.query(AuditLog).count()

            report_data = pd.DataFrame({
                "Metric": ["Total Support Tickets", "Open Tickets", "Total Disputes", "Total Admin Actions"],
                "Value": [total_tickets, open_tickets, total_disputes, total_admin_actions]
            })

        else:
            st.write("**Revenue Report**")
            payments = db.query(
                PaymentCache.method,
                func.sum(PaymentCache.amount),
                func.count(PaymentCache.id)
            ).filter(PaymentCache.status == "completed").group_by(PaymentCache.method).all()

            report_data = pd.DataFrame(payments, columns=["Payment Method", "Total Revenue", "Transaction Count"]) if payments else pd.DataFrame({"Metric": ["No data"], "Value": ["-"]})

        st.dataframe(report_data, use_container_width=True, hide_index=True)

        csv = report_data.to_csv(index=False)
        st.download_button(
            label=f"Download {report_type} CSV",
            data=csv,
            file_name=f"{report_type.lower().replace(' ', '_')}_report.csv",
            mime="text/csv",
            key=f"download_{report_type.lower().replace(' ', '_')}",
        )
    finally:
        db.close()


@require_admin
def render(*, admin):
    render_sidebar(admin)
    st.title("Analytics & Reports")

    tab_overview, tab_bookings, tab_activity, tab_reports = st.tabs([
        "Overview", "Booking Insights", "User Activity", "Reports & Export"
    ])

    with tab_overview:
        _render_overview()

    with tab_bookings:
        _render_booking_insights()

    with tab_activity:
        _render_user_activity()

    with tab_reports:
        _render_reports()
