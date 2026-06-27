import { useState, useEffect, useCallback, useMemo } from 'react'
import '../../styles/revenue.css'
import {
  IconChart,
  IconMoney,
  IconWallet,
  IconArrowUp,
  IconArrowDown,
  IconDownload,
  IconCalendar,
} from '../../components/icons'
import { getBookings } from '../../api/bookings'
import axiosInstance from '../../api/axiosInstance'

/* ─── Constants ──────────────────────────────────────────────── */

const COMMISSION_RATE = 0.13
const PERIODS = ['This Month', 'Last 3 Months', 'Last 6 Months']
const PROP_COLORS = [
  '#1B2A4A', '#C9A84C', '#16A34A', '#DC2626',
  '#2563EB', '#9333EA', '#EA580C', '#0891B2',
]

/* ─── Helpers ────────────────────────────────────────────────── */

const fmt = (n) =>
  '₱' + Number(n || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })

function periodStartDate(period) {
  const now = new Date()
  if (period === 'This Month') return new Date(now.getFullYear(), now.getMonth(), 1)
  if (period === 'Last 3 Months') {
    const d = new Date(now); d.setMonth(d.getMonth() - 3); return d
  }
  const d = new Date(now); d.setMonth(d.getMonth() - 6); return d
}

function deriveRevenue(bookings, propertyMap, period) {
  const start = periodStartDate(period)
  const PAID = ['confirmed', 'completed']

  const filtered = bookings.filter(b => {
    if (!PAID.includes(b.status)) return false
    const d = new Date(b.check_in || b.created_at)
    return d >= start
  })

  const gross = filtered.reduce((s, b) => s + Number(b.total_price || 0), 0)
  const commission = gross * COMMISSION_RATE
  const net = gross - commission
  const avgPerBooking = filtered.length > 0 ? gross / filtered.length : 0

  // Monthly breakdown
  const monthMap = {}
  filtered.forEach(b => {
    const d = new Date(b.check_in || b.created_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleString('en-PH', { month: 'short', year: '2-digit' })
    if (!monthMap[key]) monthMap[key] = { key, label, gross: 0, count: 0 }
    monthMap[key].gross += Number(b.total_price || 0)
    monthMap[key].count += 1
  })

  const monthlyData = Object.values(monthMap)
    .sort((a, b) => a.key.localeCompare(b.key))
    .map(m => ({ ...m, net: m.gross * (1 - COMMISSION_RATE) }))

  // By property
  const propMap = {}
  filtered.forEach(b => {
    const pid = String(b.property_id)
    if (!propMap[pid]) propMap[pid] = { id: pid, bookings: 0, gross: 0 }
    propMap[pid].bookings += 1
    propMap[pid].gross += Number(b.total_price || 0)
  })

  const propKeys = Object.keys(propertyMap)
  const byProperty = Object.entries(propMap).map(([id, s]) => {
    const prop = propertyMap[id] || {}
    const comm = s.gross * COMMISSION_RATE
    const colorIdx = propKeys.indexOf(id)
    return {
      id,
      name: prop.title || `Property #${id}`,
      type: prop.property_type?.replace(/_/g, ' ') || '',
      bookings: s.bookings,
      gross: s.gross,
      commission: comm,
      net: s.gross - comm,
      color: PROP_COLORS[colorIdx >= 0 ? colorIdx % PROP_COLORS.length : 0],
    }
  }).sort((a, b) => b.gross - a.gross)

  return { gross, commission, net, avgPerBooking, monthlyData, byProperty, totalFiltered: filtered.length }
}

/* ─── SVG Bar Chart ──────────────────────────────────────────── */

function BarChart({ data, view }) {
  if (!data || data.length === 0) {
    return (
      <div className="rev-empty" style={{ padding: 'var(--space-10) 0' }}>
        <svg className="rev-empty-icon" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="M4 19h16M6 11v6M10 7v10M14 13v4M18 9v8" />
        </svg>
        <p className="rev-empty-text">No revenue data for this period.</p>
      </div>
    )
  }

  const W = 600; const H = 200
  const PAD = { t: 12, r: 12, b: 36, l: 56 }
  const chartW = W - PAD.l - PAD.r
  const chartH = H - PAD.t - PAD.b
  const maxVal = Math.max(...data.map(d => d.gross), 1) * 1.15
  const barW = Math.min(44, (chartW / data.length) * 0.5)
  const gap = chartW / data.length
  const yTicks = 4
  const yStep = Math.ceil(maxVal / yTicks / 5000) * 5000 || 1000

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="rev-bar-chart"
      role="img" aria-label="Revenue bar chart">
      {Array.from({ length: yTicks + 1 }).map((_, i) => {
        const val = i * yStep
        const y = PAD.t + chartH - (val / maxVal) * chartH
        return (
          <g key={i}>
            <line x1={PAD.l} y1={y} x2={PAD.l + chartW} y2={y}
              stroke="var(--color-border)" strokeWidth="1"
              strokeDasharray={i === 0 ? '0' : '4 3'} />
            <text x={PAD.l - 8} y={y + 4} textAnchor="end" fontSize="10"
              fill="var(--color-text-muted)" fontFamily="var(--font-body)">
              {val >= 1000 ? `₱${(val / 1000).toFixed(0)}k` : `₱${val}`}
            </text>
          </g>
        )
      })}
      {data.map((d, i) => {
        const cx = PAD.l + gap * i + gap / 2
        const grossH = Math.max((d.gross / maxVal) * chartH, 0)
        const netH = Math.max((d.net / maxVal) * chartH, 0)
        const grossY = PAD.t + chartH - grossH
        const netY = PAD.t + chartH - netH
        const offset = view === 'both' ? barW / 2 + 2 : 0
        return (
          <g key={d.key}>
            {(view === 'gross' || view === 'both') && (
              <rect x={cx - barW / 2 - offset} y={grossY}
                width={barW} height={grossH} rx="3"
                fill="var(--color-primary)" opacity="0.85">
                <title>{`Gross: ${fmt(d.gross)}`}</title>
              </rect>
            )}
            {(view === 'net' || view === 'both') && (
              <rect x={cx - barW / 2 + offset} y={netY}
                width={barW} height={netH} rx="3"
                fill="var(--color-success)" opacity="0.85">
                <title>{`Net: ${fmt(d.net)}`}</title>
              </rect>
            )}
            <text x={cx} y={PAD.t + chartH + 18} textAnchor="middle" fontSize="10"
              fill="var(--color-text-secondary)" fontFamily="var(--font-body)" fontWeight="500">
              {d.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

/* ─── Commission Donut ───────────────────────────────────────── */

function CommissionDonut({ rate }) {
  const r = 52; const cx = 64; const cy = 64
  const circ = 2 * Math.PI * r
  const hostArc = circ * (1 - rate)
  const commArc = circ * rate
  return (
    <svg viewBox="0 0 128 128" width="120" height="120"
      style={{ display: 'block', margin: '0 auto' }} aria-hidden="true">
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke="var(--color-primary)" strokeWidth="18"
        strokeDasharray={`${hostArc} ${circ}`}
        strokeDashoffset={circ * 0.25} strokeLinecap="butt" />
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke="var(--color-error)" strokeWidth="18"
        strokeDasharray={`${commArc} ${circ}`}
        strokeDashoffset={circ * 0.25 - hostArc}
        strokeLinecap="butt" opacity="0.7" />
      <text x={cx} y={cy - 5} textAnchor="middle" fontSize="16"
        fontWeight="800" fill="var(--color-text-primary)"
        fontFamily="var(--font-heading)">
        {Math.round((1 - rate) * 100)}%
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="9"
        fill="var(--color-text-muted)" fontFamily="var(--font-body)">
        your share
      </text>
    </svg>
  )
}

/* ─── KPI Card ───────────────────────────────────────────────── */

function KpiCard({ label, value, sub, delta, up, icon, variant, iconVariant }) {
  return (
    <article className={`rev-kpi-card rev-kpi-card--${variant}`}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className={`rev-kpi-icon rev-kpi-icon--${iconVariant}`} aria-hidden="true">
          {icon}
        </span>
        {delta && (
          <span className={`rev-kpi-delta rev-kpi-delta--${up ? 'up' : 'down'}`}>
            {up
              ? <IconArrowUp width={10} height={10} />
              : <IconArrowDown width={10} height={10} />}
            {delta}
          </span>
        )}
      </div>
      <div>
        <div className="rev-kpi-label">{label}</div>
        <div className="rev-kpi-value">{value}</div>
        {sub && (
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 3 }}>
            {sub}
          </div>
        )}
      </div>
    </article>
  )
}

/* ─── Export CSV ─────────────────────────────────────────────── */

function exportCsv(rows, filename) {
  if (!rows.length) return
  const header = Object.keys(rows[0]).join(',')
  const body = rows.map(r => Object.values(r).join(',')).join('\n')
  const blob = new Blob([header + '\n' + body], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

/* ─── Skeleton ───────────────────────────────────────────────── */

function RevenueSkeleton() {
  return (
    <div className="rev-page">
      <div className="rev-header">
        <div>
          <div className="rev-skeleton" style={{ width: 160, height: 32, marginBottom: 8 }} />
          <div className="rev-skeleton" style={{ width: 260, height: 16 }} />
        </div>
      </div>
      <div className="rev-kpi-grid">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="rev-kpi-card" style={{ gap: 'var(--space-3)' }}>
            <div className="rev-skeleton" style={{ width: 36, height: 36, borderRadius: 8 }} />
            <div className="rev-skeleton" style={{ width: '55%', height: 12 }} />
            <div className="rev-skeleton" style={{ width: '80%', height: 28 }} />
          </div>
        ))}
      </div>
      <div className="rev-chart-card">
        <div style={{ padding: 'var(--space-5)' }}>
          <div className="rev-skeleton" style={{ width: '100%', height: 200 }} />
        </div>
      </div>
    </div>
  )
}

/* ─── Error ──────────────────────────────────────────────────── */

function RevenueError({ message, onRetry }) {
  return (
    <div className="rev-page">
      <div className="rev-empty" style={{ minHeight: 300 }}>
        <svg className="rev-empty-icon" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
        </svg>
        <p className="rev-empty-text">{message || 'Failed to load revenue data.'}</p>
        <button className="rev-export-btn" onClick={onRetry}
          style={{ marginTop: 'var(--space-4)' }}>
          Try again
        </button>
      </div>
    </div>
  )
}

/* ─── Main ───────────────────────────────────────────────────── */

export default function RevenuePage() {
  const [period, setPeriod] = useState('Last 6 Months')
  const [chartView, setChartView] = useState('both')
  const [bookings, setBookings] = useState([])
  const [propertyMap, setPropertyMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // 1. Fetch host properties for metadata (title, type)
      const propsRes = await axiosInstance.get('/api/host/properties')
      const properties = propsRes.data?.data?.properties ?? []
      const ids = properties.map(p => String(p.property_id))

      const map = {}
      properties.forEach(p => {
        map[String(p.property_id)] = {
          title: p.title,
          property_type: p.property_type,
        }
      })
      setPropertyMap(map)

      if (ids.length === 0) {
        setBookings([])
        setLoading(false)
        return
      }

      // 2. Fetch all bookings from client backend
      const bRes = await getBookings(ids)
      setBookings(bRes.data ?? [])
    } catch (err) {
      setError(
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Something went wrong.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const { gross, commission, net, avgPerBooking, monthlyData, byProperty, totalFiltered } =
    useMemo(() => deriveRevenue(bookings, propertyMap, period), [bookings, propertyMap, period])

  if (loading) return <RevenueSkeleton />
  if (error) return <RevenueError message={error} onRetry={load} />

  return (
    <div className="rev-page">

      {/* ── Header ── */}
      <header className="rev-header">
        <div>
          <h1 className="rev-title">Revenue</h1>
          <p className="rev-subtitle">
            Earnings, commissions, and payout breakdown across all properties.
          </p>
        </div>
        <div className="rev-period-bar">
          <div className="rev-period-tabs" role="tablist" aria-label="Period filter">
            {PERIODS.map(p => (
              <button key={p} role="tab" aria-selected={period === p}
                className={`rev-period-tab${period === p ? ' active' : ''}`}
                onClick={() => setPeriod(p)}>
                {p}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── KPI Cards ── */}
      <section aria-label="Revenue KPIs">
        <div className="rev-kpi-grid">
          <KpiCard label="Gross Revenue" value={fmt(gross)}
            sub={`${totalFiltered} paid booking${totalFiltered !== 1 ? 's' : ''}`}
            icon={<IconMoney />} variant="gross" iconVariant="primary" />
          <KpiCard label="Platform Commission" value={fmt(commission)}
            sub={`${Math.round(COMMISSION_RATE * 100)}% rate`}
            icon={<IconChart />} variant="commission" iconVariant="danger" />
          <KpiCard label="Net Revenue" value={fmt(net)}
            sub="after commission"
            icon={<IconWallet />} variant="net" iconVariant="success" />
          <KpiCard label="Avg per Booking" value={fmt(avgPerBooking)}
            sub="gross average"
            icon={<IconCalendar />} variant="avg" iconVariant="gold" />
        </div>
      </section>

      {/* ── Body Grid ── */}
      <div className="rev-body-grid">

        {/* Left / Main */}
        <div className="rev-body-main">

          {/* Revenue chart */}
          <section className="rev-chart-card" aria-label="Revenue chart">
            <div className="rev-chart-head">
              <span className="rev-chart-title">Revenue Over Time</span>
              <div className="rev-chart-toggle" role="group" aria-label="Chart view">
                {[
                  { key: 'gross', label: 'Gross' },
                  { key: 'net', label: 'Net' },
                  { key: 'both', label: 'Both' },
                ].map(opt => (
                  <button key={opt.key} aria-pressed={chartView === opt.key}
                    className={`rev-chart-toggle-btn${chartView === opt.key ? ' active' : ''}`}
                    onClick={() => setChartView(opt.key)}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="rev-chart-body">
              <BarChart data={monthlyData} view={chartView} />
            </div>
            <div className="rev-chart-legend">
              {(chartView === 'gross' || chartView === 'both') && (
                <span className="rev-legend-item">
                  <span className="rev-legend-dot" style={{ background: 'var(--color-primary)' }} />
                  Gross Revenue
                </span>
              )}
              {(chartView === 'net' || chartView === 'both') && (
                <span className="rev-legend-item">
                  <span className="rev-legend-dot" style={{ background: 'var(--color-success)' }} />
                  Net Revenue
                </span>
              )}
            </div>
          </section>

          {/* By property */}
          <section className="rev-table-card" aria-label="Revenue by property">
            <div className="rev-table-head-row">
              <span className="rev-table-title">By Property</span>
              <button className="rev-export-btn"
                aria-label="Export property revenue as CSV"
                onClick={() => exportCsv(
                  byProperty.map(p => ({
                    Property: p.name, Type: p.type,
                    Bookings: p.bookings,
                    Gross: p.gross.toFixed(2),
                    Commission: p.commission.toFixed(2),
                    Net: p.net.toFixed(2),
                  })),
                  'revenue-by-property.csv'
                )}>
                <IconDownload width={15} height={15} />
                Export CSV
              </button>
            </div>
            {byProperty.length === 0 ? (
              <div className="rev-empty">
                <p className="rev-empty-text">No revenue data for this period.</p>
              </div>
            ) : (
              <div className="rev-table-wrapper">
                <table className="rev-table">
                  <thead>
                    <tr>
                      <th>Property</th>
                      <th>Bookings</th>
                      <th>Gross</th>
                      <th>Commission</th>
                      <th>Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byProperty.map(p => (
                      <tr key={p.id}>
                        <td>
                          <div className="rev-prop-cell">
                            <span className="rev-prop-dot" style={{ background: p.color }} />
                            <div>
                              <div className="rev-prop-name">{p.name}</div>
                              <div className="rev-prop-type">{p.type}</div>
                            </div>
                          </div>
                        </td>
                        <td><span className="rev-badge-bookings">{p.bookings}</span></td>
                        <td><span className="rev-amount-gross">{fmt(p.gross)}</span></td>
                        <td><span className="rev-amount-commission">−{fmt(p.commission)}</span></td>
                        <td><span className="rev-amount-net">{fmt(p.net)}</span></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td>Total</td>
                      <td style={{ textAlign: 'right' }}>
                        {byProperty.reduce((s, p) => s + p.bookings, 0)}
                      </td>
                      <td>{fmt(gross)}</td>
                      <td style={{ color: 'var(--color-error)' }}>−{fmt(commission)}</td>
                      <td style={{ color: 'var(--color-success)', fontWeight: 700 }}>{fmt(net)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </section>

          {/* Monthly earnings */}
          <section className="rev-earnings-card" aria-label="Monthly earnings report">
            <div className="rev-earnings-head">
              <span className="rev-earnings-title">Monthly Earnings Report</span>
              <div className="rev-export-group">
                <button className="rev-export-btn" aria-label="Export as CSV"
                  onClick={() => exportCsv(
                    [...monthlyData].reverse().map(m => ({
                      Month: m.label,
                      Bookings: m.count,
                      Gross: m.gross.toFixed(2),
                      Commission: (m.gross * COMMISSION_RATE).toFixed(2),
                      Net: m.net.toFixed(2),
                    })),
                    'monthly-earnings.csv'
                  )}>
                  <IconDownload width={15} height={15} />
                  CSV
                </button>
              </div>
            </div>
            {monthlyData.length === 0 ? (
              <div className="rev-empty">
                <p className="rev-empty-text">No monthly data for this period.</p>
              </div>
            ) : (
              <div className="rev-table-wrapper">
                <table className="rev-table">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Bookings</th>
                      <th>Gross</th>
                      <th>Commission</th>
                      <th>Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...monthlyData].reverse().map((row, i) => {
                      const maxGross = Math.max(...monthlyData.map(r => r.gross), 1)
                      const barWidth = Math.round((row.gross / maxGross) * 60)
                      return (
                        <tr key={i}>
                          <td>
                            <span className="rev-month-bar" style={{ width: barWidth }}
                              aria-hidden="true" />
                            <strong>{row.label}</strong>
                          </td>
                          <td>{row.count}</td>
                          <td>{fmt(row.gross)}</td>
                          <td style={{ color: 'var(--color-error)' }}>
                            −{fmt(row.gross * COMMISSION_RATE)}
                          </td>
                          <td style={{ color: 'var(--color-success)', fontWeight: 700 }}>
                            {fmt(row.net)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* Right / Sidebar */}
        <div className="rev-body-side">

          {/* Commission split */}
          <div className="rev-chart-card" style={{ padding: 'var(--space-5)' }}
            aria-label="Commission breakdown">
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <div className="rev-chart-title" style={{ marginBottom: 4 }}>
                Commission Breakdown
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                Platform fee applied per booking
              </div>
            </div>
            <CommissionDonut rate={COMMISSION_RATE} />
            <div style={{
              display: 'flex', flexDirection: 'column',
              gap: 'var(--space-3)', marginTop: 'var(--space-4)',
            }}>
              {[
                {
                  label: 'Your Net Share',
                  pct: Math.round((1 - COMMISSION_RATE) * 100),
                  color: 'var(--color-primary)',
                  amount: net,
                },
                {
                  label: 'Platform Commission',
                  pct: Math.round(COMMISSION_RATE * 100),
                  color: 'var(--color-error)',
                  amount: commission,
                },
              ].map(item => (
                <div key={item.label}
                  style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <span className="rev-legend-dot"
                    style={{ background: item.color, width: 10, height: 10, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                      {fmt(item.amount)}
                    </div>
                  </div>
                  <strong style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>
                    {item.pct}%
                  </strong>
                </div>
              ))}
            </div>
            <div style={{
              marginTop: 'var(--space-5)',
              paddingTop: 'var(--space-4)',
              borderTop: '1.5px solid var(--color-border)',
            }}>
              <div style={{
                fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 4,
              }}>
                Total Gross ({period})
              </div>
              <div style={{
                fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)',
                fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-text-primary)',
              }}>
                {fmt(gross)}
              </div>
            </div>
          </div>

          {/* Property share */}
          {byProperty.length > 0 && (
            <div className="rev-chart-card" style={{ padding: 'var(--space-5)' }}>
              <div className="rev-chart-title" style={{ marginBottom: 'var(--space-4)' }}>
                Property Share
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {byProperty.slice(0, 6).map(p => {
                  const pct = gross > 0 ? (p.gross / gross) * 100 : 0
                  return (
                    <div key={p.id}>
                      <div style={{
                        display: 'flex', justifyContent: 'space-between', marginBottom: 4,
                      }}>
                        <div style={{
                          fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)',
                          fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap', maxWidth: '65%',
                        }}>
                          {p.name}
                        </div>
                        <div style={{
                          fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)',
                          fontWeight: 600,
                        }}>
                          {pct.toFixed(1)}%
                        </div>
                      </div>
                      <div style={{
                        height: 5, background: 'var(--color-surface-alt)', borderRadius: 99,
                      }}>
                        <div style={{
                          height: '100%', width: `${pct}%`, background: p.color,
                          borderRadius: 99, transition: 'width 0.4s ease',
                        }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}