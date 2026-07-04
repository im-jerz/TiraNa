import { useState, useEffect, useCallback } from 'react'
import { getHostVerifications, approveHostVerification, rejectHostVerification, approveGuestVerification, rejectGuestVerification } from '../../api/admin'

export default function AdminVerifications() {
  const [verifications, setVerifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState({ status: '', type: '' })
  const [selected, setSelected] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [confirmApprove, setConfirmApprove] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getHostVerifications(filter)
      setVerifications(data)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }, [filter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleApprove = async (id) => {
    setActionLoading(true)
    try {
      if (confirmApprove?.type === 'guest') {
        await approveGuestVerification(id)
      } else {
        await approveHostVerification(id)
      }
      fetchData()
      setSelected(null)
      setConfirmApprove(null)
    } catch (err) {
      setError(err.message)
    }
    setActionLoading(false)
  }

  const handleReject = async (id) => {
    if (!rejectReason) return
    setActionLoading(true)
    try {
      if (selected?.type === 'guest') {
        await rejectGuestVerification(id, rejectReason)
      } else {
        await rejectHostVerification(id, rejectReason)
      }
      fetchData()
      setSelected(null)
      setRejectReason('')
    } catch (err) {
      setError(err.message)
    }
    setActionLoading(false)
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Account Verifications</h1>
        </div>
      </div>

      {error && (
        <div className="alert-strip alert-danger" style={{ marginBottom: '16px' }}>
          <div className="alert-strip-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div className="alert-strip-content"><p>{error}</p></div>
        </div>
      )}

      <div className="table-container">
        <div className="table-filters">
          <select className="filter-select" value={filter.status} onChange={e => setFilter({ ...filter, status: e.target.value })}>
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select className="filter-select" value={filter.type} onChange={e => setFilter({ ...filter, type: e.target.value })}>
            <option value="">All Types</option>
            <option value="host">Hosts</option>
            <option value="guest">Guests</option>
          </select>
        </div>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Type</th>
              <th>Status</th>
              <th>Date</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6}>
                  <div className="loader"><div className="spin"></div></div>
                </td>
              </tr>
            ) : verifications.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    <p>No verification requests found.</p>
                  </div>
                </td>
              </tr>
            ) : verifications.map(v => (
              <tr key={v.id}>
                <td className="td-main">{v.name}</td>
                <td className="td-muted">{v.email}</td>
                <td><span className={`badge badge-${v.type === 'host' ? 'active' : 'completed'}`}>{v.type}</span></td>
                <td><span className={`badge badge-${v.status}`}>{v.status}</span></td>
                <td className="td-muted">{new Date(v.created_at).toLocaleDateString()}</td>
                <td>
                  <div className="td-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => setSelected(v)}>Review</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Review Modal */}
      <div className={`modal-overlay ${selected ? 'open' : ''}`} onClick={() => setSelected(null)}>
        <div className="modal modal-lg" style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2 className="modal-title">Review Verification</h2>
            <button className="modal-close" onClick={() => setSelected(null)}>×</button>
          </div>
          {selected && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="user-avatar-group">
                <div className="user-avatar-lg">{selected.name?.[0] || 'U'}</div>
                <div className="user-avatar-name">{selected.name}</div>
                <div className="user-avatar-email">{selected.email}</div>
                <span className={`badge badge-${selected.status}`}>{selected.status}</span>
              </div>

              <div className="info-grid">
                <div className="info-item">
                  <p>User Type</p>
                  <p><span className={`badge badge-${selected.type === 'host' ? 'active' : 'completed'}`}>{selected.type}</span></p>
                </div>
                <div className="info-item">
                  <p>Phone Number</p>
                  <p>{selected.phone || 'N/A'}</p>
                </div>
                <div className="info-item">
                  <p>Joined Date</p>
                  <p>{new Date(selected.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="doc-preview">
                  <div className="doc-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '13px', color: 'var(--dark)' }}>ID Document</p>
                    {selected.id_url ? (
                      <a href={selected.id_url} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: 'var(--brand)' }}>View Document →</a>
                    ) : (
                      <p style={{ fontSize: '12px', color: '#9ca3af' }}>Not uploaded</p>
                    )}
                  </div>
                </div>
                <div className="doc-preview">
                  <div className="doc-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '13px', color: 'var(--dark)' }}>Verification Selfie</p>
                    {selected.selfie_url ? (
                      <a href={selected.selfie_url} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: 'var(--brand)' }}>View Selfie →</a>
                    ) : (
                      <p style={{ fontSize: '12px', color: '#9ca3af' }}>Not uploaded</p>
                    )}
                  </div>
                </div>
              </div>

              {selected.status === 'pending' ? (
                <>
                  <div className="form-group">
                    <label className="form-label">Rejection Reason</label>
                    <textarea
                      className="form-textarea"
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                      placeholder="Why is this being rejected? (Required for rejection)"
                    />
                  </div>
                  <div className="modal-footer">
                    <button
                      className="btn btn-ghost"
                      onClick={() => handleReject(selected.id)}
                      disabled={actionLoading || !rejectReason.trim()}
                    >
                      {actionLoading && rejectReason ? 'Rejecting...' : 'Reject'}
                    </button>
                    <button
                      className="btn btn-brand"
                      onClick={() => setConfirmApprove(selected)}
                      disabled={actionLoading}
                    >
                      Approve
                    </button>
                  </div>
                </>
              ) : (
                <div className={`alert-strip ${selected.status === 'approved' ? 'alert-success' : 'alert-danger'}`}>
                  <div className="alert-strip-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div className="alert-strip-content">
                    <p>Final Status: {selected.status}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirm Approve Modal */}
      <div className={`modal-overlay ${confirmApprove ? 'open' : ''}`} onClick={() => setConfirmApprove(null)}>
        <div className="modal" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2 className="modal-title">Confirm Approval</h2>
            <button className="modal-close" onClick={() => setConfirmApprove(null)}>×</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '0 0 8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" fill="none" stroke="#16a34a" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--dark)' }}>Approve {confirmApprove?.name || 'user'}?</p>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>Type: <span className={`badge badge-${confirmApprove?.type === 'host' ? 'active' : 'completed'}`} style={{ fontSize: '11px' }}>{confirmApprove?.type}</span></p>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: 0, lineHeight: '1.6' }}>
              This will mark their ID as verified and grant them full access to the platform. This action can be reversed later.
            </p>
          </div>
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={() => setConfirmApprove(null)} disabled={actionLoading}>
              Cancel
            </button>
            <button
              className="btn btn-brand"
              onClick={() => handleApprove(confirmApprove?.id)}
              disabled={actionLoading}
            >
              {actionLoading ? 'Approving...' : 'Yes, Approve'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
