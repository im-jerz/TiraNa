import { useState, useEffect, useCallback } from 'react'
import { getWithdrawals, approveWithdrawal, rejectWithdrawal } from '../../api/admin'

export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [acting, setActing] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try { setWithdrawals(await getWithdrawals({ status: statusFilter })) }
    catch (err) { setError(err.message) }
    setLoading(false)
  }, [statusFilter])

  useEffect(() => { fetchData() }, [fetchData])

  const handleApprove = async (id) => {
    setActing(true)
    try { await approveWithdrawal(id); fetchData() }
    catch (err) { setError(err.message) }
    setActing(false)
  }

  const handleReject = async () => {
    if (!rejectModal || !rejectReason.trim()) return
    setActing(true)
    try { await rejectWithdrawal(rejectModal.id, rejectReason); setRejectModal(null); setRejectReason(''); fetchData() }
    catch (err) { setError(err.message) }
    setActing(false)
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Withdrawals</h1>
        <div className="page-actions">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {error && <div className="alert-strip alert-danger" style={{marginBottom:16}}><div className="alert-strip-content"><p>Error</p><p>{error}</p></div></div>}

      <div className="table-container">
        {loading ? (
          <div className="loader"><div className="spin" /></div>
        ) : withdrawals.length === 0 ? (
          <div className="empty-state">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p>No withdrawals found.</p>
          </div>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Host</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th style={{textAlign:'right'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((w) => (
                  <tr key={w.id}>
                    <td className="td-id">{w.id}</td>
                    <td className="td-main">{w.host_name || '—'}</td>
                    <td className="td-amount">₱{Number(w.amount).toLocaleString()}</td>
                    <td className="td-muted">{w.method || '—'}</td>
                    <td><span className={`badge badge-${w.status}`}>{w.status}</span></td>
                    <td className="td-muted">{new Date(w.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="td-actions">
                        {w.status === 'pending' && (
                          <>
                            <button onClick={() => handleApprove(w.id)} disabled={acting} className="btn btn-brand btn-sm">Approve</button>
                            <button onClick={() => setRejectModal(w)} disabled={acting} className="btn btn-ghost btn-sm">Reject</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="pagination">
              <div className="pagination-info">{withdrawals.length} withdrawal(s)</div>
            </div>
          </>
        )}
      </div>

      {rejectModal && (
        <div className="modal-overlay open">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Reject Withdrawal</h2>
              <button onClick={() => setRejectModal(null)} className="modal-close">&times;</button>
            </div>
            <p style={{fontSize:13,color:'#6b7280',marginBottom:16}}>{rejectModal.host_name} — ₱{rejectModal.amount}</p>
            <div className="form-group">
              <label className="form-label">Rejection Reason</label>
              <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Rejection reason (required)..." className="form-textarea" rows={3} />
            </div>
            <div className="modal-footer">
              <button onClick={() => setRejectModal(null)} disabled={acting} className="btn btn-ghost">Cancel</button>
              <button onClick={handleReject} disabled={acting || !rejectReason.trim()} className="btn btn-brand">{acting ? 'Rejecting...' : 'Reject'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
