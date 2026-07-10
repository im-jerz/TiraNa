import { useState, useEffect, useCallback } from 'react'
import { getPayments, refundPayment, getRevenueStats } from '../../api/admin'
import { useDebounce } from '../../hooks/useDebounce'

export default function AdminPayments() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 500)
  const [statusFilter, setStatusFilter] = useState('')
  const [revenue, setRevenue] = useState(null)
  const [refundModal, setRefundModal] = useState(null)
  const [refundAmount, setRefundAmount] = useState('')
  const [refundReason, setRefundReason] = useState('')
  const [acting, setActing] = useState(false)
  const [detailModal, setDetailModal] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [p, r] = await Promise.all([
        getPayments({ search: debouncedSearch, status: statusFilter }),
        getRevenueStats(),
      ])
      setPayments(p)
      setRevenue(r)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }, [debouncedSearch, statusFilter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleRefund = async () => {
    if (!refundModal || !refundAmount || !refundReason.trim()) return
    setActing(true)
    try {
      await refundPayment(refundModal.id, parseFloat(refundAmount), refundReason)
      setRefundModal(null)
      setRefundAmount('')
      setRefundReason('')
      fetchData()
    } catch (err) {
      setError(err.message)
    }
    setActing(false)
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Payments & Revenue</h1>
        <div className="page-actions">
          <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="refunded">Refunded</option>
            <option value="failed">Failed</option>
          </select>
          <input className="filter-input" type="text" placeholder="Search payments..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {revenue && (
        <div className="stat-grid" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-card-top">
              <span className="stat-label">Total Revenue</span>
              <svg width="20" height="20" fill="none" stroke="#059669" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div className="stat-value">₱{Number(revenue.total_revenue).toLocaleString()}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-top">
              <span className="stat-label">Total Refunded</span>
              <svg width="20" height="20" fill="none" stroke="#dc2626" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" /></svg>
            </div>
            <div className="stat-value" style={{ color: '#dc2626' }}>₱{Number(revenue.total_refunded).toLocaleString()}</div>
          </div>
        </div>
      )}

      {error && (
        <div className="alert-strip alert-danger" style={{ marginBottom: 16 }}>
          <div className="alert-strip-content"><p>{error}</p></div>
        </div>
      )}

      <div className="table-container">
        {loading ? (
          <div className="loader"><div className="spin" /></div>
        ) : payments.length === 0 ? (
          <div className="empty-state">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            <p>{search || statusFilter ? 'No payments match your search.' : 'No payments found.'}</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Payer</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th>Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="td-id">#{p.id}</td>
                  <td className="td-main">{p.payer_name || '—'}</td>
                  <td className="td-amount">₱{Number(p.amount).toLocaleString()}</td>
                  <td className="td-muted" style={{ textTransform: 'uppercase', fontSize: 11 }}>{p.method || '—'}</td>
                  <td><span className={`badge badge-${p.status}`}>{p.status}</span></td>
                  <td className="td-muted">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="td-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => setDetailModal(p)}>Details</button>
                      {p.status === 'completed' && (
                        <button className="btn btn-sm" style={{ background: '#f3e8ff', color: '#6b21a8', borderColor: '#e9d5ff' }} onClick={() => { setRefundModal(p); setRefundAmount(String(p.amount)) }}>Refund</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Payment Detail Modal */}
      <div className={`modal-overlay ${detailModal ? 'open' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) setDetailModal(null) }}>
        <div className="modal modal-lg">
          <div className="modal-header">
            <h2 className="modal-title">Payment #{detailModal?.id}</h2>
            <button className="modal-close" onClick={() => setDetailModal(null)}>✕</button>
          </div>
          {detailModal && (
            <>
              <div className="info-grid">
                <div className="info-item"><p>Transaction ID</p><p>#{detailModal.id}</p></div>
                <div className="info-item"><p>Status</p><p><span className={`badge badge-${detailModal.status}`}>{detailModal.status}</span></p></div>
                <div className="info-item"><p>Payer</p><p>{detailModal.payer_name}</p></div>
                <div className="info-item"><p>Amount</p><p>₱{Number(detailModal.amount).toLocaleString()}</p></div>
                <div className="info-item"><p>Method</p><p style={{ textTransform: 'uppercase' }}>{detailModal.method}</p></div>
                <div className="info-item"><p>Date Paid</p><p>{new Date(detailModal.created_at).toLocaleString()}</p></div>
              </div>
              {detailModal.booking_external_id && (
                <div className="form-group">
                  <label className="form-label">Booking Reference</label>
                  <p className="td-main">{detailModal.booking_external_id}</p>
                </div>
              )}
              {detailModal.refund_reason && (
                <div className="alert-strip" style={{ background: '#f3e8ff', borderColor: '#e9d5ff', color: '#6b21a8' }}>
                  <div className="alert-strip-content">
                    <p>Refund Information</p>
                    <p>Reason: {detailModal.refund_reason}</p>
                  </div>
                </div>
              )}
              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={() => setDetailModal(null)}>Close</button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Refund Modal */}
      <div className={`modal-overlay ${refundModal ? 'open' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) setRefundModal(null) }}>
        <div className="modal">
          <div className="modal-header">
            <h2 className="modal-title">Refund Payment</h2>
            <button className="modal-close" onClick={() => setRefundModal(null)}>✕</button>
          </div>
          {refundModal && (
            <>
              <div className="alert-strip" style={{ background: '#f3e8ff', borderColor: '#e9d5ff', color: '#6b21a8' }}>
                <div className="alert-strip-content">
                  <p>Process a refund for {refundModal.payer_name}'s payment of ₱{Number(refundModal.amount).toLocaleString()}.</p>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Refund Amount (max ₱{refundModal.amount})</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: '#9ca3af' }}>₱</span>
                  <input className="form-input" type="number" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} max={refundModal.amount} style={{ paddingLeft: 28 }} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Reason for Refund</label>
                <textarea className="form-textarea" value={refundReason} onChange={(e) => setRefundReason(e.target.value)} placeholder="Explain why this refund is being issued..." />
              </div>
              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={() => setRefundModal(null)} disabled={acting}>Cancel</button>
                <button className="btn" style={{ background: '#7c3aed', color: '#fff', borderColor: '#7c3aed' }} onClick={handleRefund} disabled={!refundAmount || !refundReason.trim() || acting}>{acting ? 'Processing...' : 'Issue Refund'}</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
