import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getDashboardStats } from '../../api/client'

export default function DashboardHome() {
  const [stats, setStats] = useState({
    total_users: 0,
    active_listings: 0,
    total_bookings: 0,
    revenue_this_month: 0,
    verified_users: 0,
    unverified_users: 0,
    open_support_tickets: 0,
    pending_withdrawals: 0,
    revenue_trend: [],
    booking_trend: [],
  })
  const [period, setPeriod] = useState('monthly')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await getDashboardStats(period).catch(() => null)
        if (data) {
          setStats({
            total_users: data.total_users || 0,
            active_listings: data.active_listings || 0,
            total_bookings: data.total_bookings || 0,
            revenue_this_month: data.revenue_this_month || 0,
            verified_users: data.verified_users || 0,
            unverified_users: data.unverified_users || 0,
            open_support_tickets: data.open_support_tickets || 0,
            pending_withdrawals: data.pending_withdrawals || 0,
            revenue_trend: data.revenue_trend || [],
            booking_trend: data.booking_trend || [],
          })
        }
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [period])

  const verifiedPercentage = stats.total_users > 0 ? Math.round((stats.verified_users / stats.total_users) * 100) : 0;

  const renderTrendChart = (data, color) => {
    if (!data || data.length === 0) return (
      <div style={{height:'120px',display:'flex',alignItems:'center',justifyContent:'center',color:'#9ca3af',fontSize:'12px',fontStyle:'italic'}}>
        No trend data available for this period
      </div>
    )

    const max = Math.max(...data.map(d => d.value), 1)
    return (
      <>
        <div className="bar-chart">
          {data.map((d, i) => (
            <div
              key={i}
              className="bar"
              style={{ height: `${(d.value / max) * 100}%`, background: color }}
              title={`${d.label}: ${d.value}`}
            />
          ))}
        </div>
        <div className="bar-labels" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
          <span className="bar-label" style={{ fontSize: '11px', color: '#6b7280' }}>{data[0]?.label}</span>
          <span className="bar-label" style={{ fontSize: '11px', color: '#6b7280' }}>{data[data.length - 1]?.label}</span>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">System Overview</h1>
          <p className="page-subtitle">{loading ? 'Loading...' : 'Platform performance and health metrics.'}</p>
        </div>
        <div className="page-actions">
          <div className="period-picker">
            {['daily', 'weekly', 'monthly'].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`period-btn ${period === p ? 'active' : ''}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-label">Total Users</span>
            <div className="stat-icon" style={{ background: 'var(--brand)' }}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>
            </div>
          </div>
          <div className="stat-value">{stats.total_users}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-label">Active Listings</span>
            <div className="stat-icon" style={{ background: 'var(--blue)' }}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            </div>
          </div>
          <div className="stat-value">{stats.active_listings}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-label">Total Bookings</span>
            <div className="stat-icon" style={{ background: 'var(--green)' }}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
          </div>
          <div className="stat-value">{stats.total_bookings}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-label">Monthly Revenue</span>
            <div className="stat-icon" style={{ background: 'var(--purple)' }}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
          <div className="stat-value">₱{Number(stats.revenue_this_month).toLocaleString()}</div>
        </div>
      </div>

      <div className="grid-3-2">
        <div className="grid-2">
          <div className="card">
            <div className="card-title">Revenue Trend</div>
            <div className="card-subtitle">{period.charAt(0).toUpperCase() + period.slice(1)} earnings</div>
            {renderTrendChart(stats.revenue_trend, 'var(--purple)')}
          </div>
          <div className="card">
            <div className="card-title">Booking Trend</div>
            <div className="card-subtitle">{period.charAt(0).toUpperCase() + period.slice(1)} volume</div>
            {renderTrendChart(stats.booking_trend, 'var(--green)')}
          </div>
        </div>

        <div className="card">
          <div className="card-title">User Verification Status</div>
          <div className="card-subtitle">Breakdown of account trust</div>
          <div className="donut-wrap">
            <div className="donut-container" style={{ background: `conic-gradient(var(--brand) ${100 - verifiedPercentage}%, var(--emerald) 0%)` }}>
              <div className="donut-inner">
                <span className="donut-pct">{verifiedPercentage}%</span>
                <span className="donut-lbl">Verified</span>
              </div>
            </div>
            <div className="donut-legend">
              <div className="legend-item">
                <div className="legend-dot" style={{ background: 'var(--emerald)' }}></div>
                Verified ({stats.verified_users})
              </div>
              <div className="legend-item">
                <div className="legend-dot" style={{ background: 'var(--brand)' }}></div>
                Pending ({stats.unverified_users})
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="card">
          <div className="card-title">Critical Alerts</div>
          <div className="card-subtitle">Actions requiring attention</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {stats.open_support_tickets > 0 && (
              <div className="alert-strip alert-danger">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="alert-strip-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  </div>
                  <div className="alert-strip-content">
                    <p>{stats.open_support_tickets} Unresolved Tickets</p>
                    <p>Support requests awaiting response</p>
                  </div>
                </div>
                <Link to="/admin/support"><button className="btn btn-danger btn-sm">View Tickets</button></Link>
              </div>
            )}
            {stats.pending_withdrawals > 0 && (
              <div className="alert-strip alert-warning">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="alert-strip-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div className="alert-strip-content">
                    <p>{stats.pending_withdrawals} Payout Requests</p>
                    <p>Host withdrawals pending approval</p>
                  </div>
                </div>
                <Link to="/admin/withdrawals"><button className="btn btn-ghost btn-sm">Review Payouts</button></Link>
              </div>
            )}
            {stats.open_support_tickets === 0 && stats.pending_withdrawals === 0 && (
              <div className="empty-state">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p>Everything is under control</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid-2">
          <div className="card">
            <div className="card-title">Host Verification</div>
            <div className="card-subtitle">Pending Review</div>
            <Link to="/admin/verifications"><button className="btn btn-ghost btn-sm">Moderate →</button></Link>
          </div>
          <div className="card">
            <div className="card-title">Listings Approval</div>
            <div className="card-subtitle">New Properties</div>
            <Link to="/admin/listings"><button className="btn btn-ghost btn-sm">Review →</button></Link>
          </div>
        </div>
      </div>
    </>
  )
}
