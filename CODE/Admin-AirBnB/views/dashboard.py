import streamlit as st
import plotly.express as px
import pandas as pd

from database import SessionLocal
from services.host_api import host_api
from services.support_service import get_ticket_count
from services.audit_service import get_audit_logs
from views.components.sidebar import render_sidebar
from utils.auth import require_admin


def _render_kpi_cards(stats: dict):
    c1, c2, c3, c4, c5 = st.columns(5)
    c1.metric("Total Users", f"{stats.get('total_users', 0):,}")
    c2.metric("Total Bookings", f"{stats.get('total_bookings', 0):,}")
    c3.metric("Total Revenue", f"₱{stats.get('total_revenue', 0):,.2f}")
    c4.metric("Active Hosts", f"{stats.get('active_hosts', 0):,}")
    c5.metric("Active Rooms", f"{stats.get('active_rooms', 0):,}")


def _render_revenue_chart():
    st.subheader("Revenue")
    col1, col2 = st.columns([3, 1])
    with col2:
        period = st.radio("Period", ["7d", "30d", "90d", "1y"], index=1, horizontal=True, key="revenue_period")
    with col1:
        data = host_api.get_revenue(period)
        if not data:
            st.info("No revenue data available")
            return
        df = pd.DataFrame(data)
        fig = px.line(df, x="date", y="revenue", markers=True, labels={"date": "", "revenue": "Revenue (₱)"})
        fig.update_layout(margin=dict(t=10, b=10, l=10, r=10), height=300)
        st.plotly_chart(fig, use_container_width=True)


def _render_booking_chart():
    st.subheader("Bookings by Status")
    data = host_api.get_booking_stats()
    if not data:
        st.info("No booking data available")
        return
    df = pd.DataFrame(data)
    fig = px.bar(df, x="status", y="count", color="status", labels={"status": "", "count": "Bookings"})
    fig.update_layout(margin=dict(t=10, b=10, l=10, r=10), height=300, showlegend=False)
    st.plotly_chart(fig, use_container_width=True)


def _render_alerts(stats: dict):
    alerts = []
    if stats.get("pending_verifications", 0) > 0:
        alerts.append(f"{stats['pending_verifications']} pending host verifications")
    if stats.get("pending_listings", 0) > 0:
        alerts.append(f"{stats['pending_listings']} pending listing approvals")
    if stats.get("reported_rooms", 0) > 0:
        alerts.append(f"{stats['reported_rooms']} reported listings")
    if stats.get("open_disputes", 0) > 0:
        alerts.append(f"{stats['open_disputes']} open disputes")

    db = SessionLocal()
    try:
        open_tickets = get_ticket_count(db, "open")
        if open_tickets > 0:
            alerts.append(f"{open_tickets} open support tickets")
    finally:
        db.close()

    if alerts:
        st.subheader("Alerts")
        for a in alerts:
            st.warning(a)


@require_admin
def render(*, admin):
    render_sidebar(admin)

    st.title(f"Welcome, {admin.full_name}!")

    if not host_api.is_available():
        st.warning("Host API unavailable")

    with st.spinner("Loading dashboard data..."):
        stats = host_api.get_stats()

    _render_kpi_cards(stats)
    st.divider()
    _render_revenue_chart()
    _render_booking_chart()
    _render_alerts(stats)
