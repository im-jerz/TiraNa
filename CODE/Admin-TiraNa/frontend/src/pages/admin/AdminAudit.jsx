import { useState, useEffect } from 'react'
import { getAuditLogs } from '../../api/admin'

export default function AdminAudit() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const limit = 50

  useEffect(() => {
    fetchLogs()
  }, [actionFilter])

  const fetchLogs = async (append = false) => {
    try {
      setLoading(true)
      setError('')
      const data = await getAuditLogs({
        action: actionFilter,
        skip: append ? page * limit : 0,
        limit,
      })
      if (append) {
        setLogs(prev => [...prev, ...data])
      } else {
        setLogs(data)
        setPage(0)
      }
      setHasMore(data.length === limit)
    } catch (err) {
      setError(err.message || 'Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }

  const loadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchLogs(true)
  }

  const getActionStyle = (a) => {
    if (a.includes('DELETE') || a.includes('REJECT') || a.includes('CANCEL')) return {background:'#fee2e2',color:'#991b1b'}
    if (a.includes('APPROVE') || a.includes('SHOW')) return {background:'rgba(16,185,129,0.12)',color:'#065f46'}
    if (a.includes('CREATE')) return {background:'rgba(203,41,87,0.1)',color:'#CB2957'}
    return {background:'var(--gray-light)',color:'var(--dark)'}
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Audit Log</h1>
        <div className="page-actions">
          <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="filter-select">
            <option value="">All Actions</option>
            <optgroup label="Auth">
              <option value="admin_login">Admin Login</option>
              <option value="change_password">Change Password</option>
              <option value="UPDATE_PROFILE">Update Profile</option>
              <option value="admin_invite_accepted">Invite Accepted</option>
              <option value="admin_registered">Admin Registered</option>
            </optgroup>
            <optgroup label="Admin Management">
              <option value="CREATE_ADMIN">Create Admin</option>
              <option value="UPDATE_ADMIN">Update Admin</option>
              <option value="INVITE_ADMIN">Invite Admin</option>
              <option value="DELETE_ADMIN">Delete Admin</option>
            </optgroup>
            <optgroup label="Users">
              <option value="DELETE_USER">Delete User</option>
            </optgroup>
            <optgroup label="Listings">
              <option value="APPROVE_LISTING">Approve Listing</option>
              <option value="REJECT_LISTING">Reject Listing</option>
              <option value="SUSPEND_LISTING">Suspend Listing</option>
            </optgroup>
            <optgroup label="Properties">
              <option value="UPDATE_ROOM_STATUS">Update Room Status</option>
            </optgroup>
            <optgroup label="Verifications">
              <option value="APPROVE_VERIFICATION">Approve Verification</option>
              <option value="REJECT_VERIFICATION">Reject Verification</option>
            </optgroup>
            <optgroup label="Payments">
              <option value="REFUND_PAYMENT">Refund Payment</option>
            </optgroup>
            <optgroup label="Reviews">
              <option value="HIDE_REVIEW">Hide Review</option>
              <option value="SHOW_REVIEW">Show Review</option>
            </optgroup>
            <optgroup label="Withdrawals">
              <option value="APPROVE_WITHDRAWAL">Approve Withdrawal</option>
              <option value="REJECT_WITHDRAWAL">Reject Withdrawal</option>
            </optgroup>
            <optgroup label="System">
              <option value="UPDATE_SETTING">Update Setting</option>
              <option value="UPDATE_TICKET">Update Ticket</option>
              <option value="UPDATE_DISPUTE">Update Dispute</option>
            </optgroup>
          </select>
        </div>
      </div>

      {error && <div className="alert-strip alert-danger" style={{marginBottom:16}}><div className="alert-strip-content"><p>Error</p><p>{error}</p></div></div>}

      {loading && logs.length === 0 ? (
        <div style={{display:'flex',justifyContent:'center',padding:'60px 0'}}>
          <div className="spinner" />
        </div>
      ) : logs.length === 0 ? (
        <div className="empty-state">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
          <p>No audit logs found.</p>
        </div>
      ) : (
        <>
          <div className="audit-list">
            {logs.map((log) => (
              <div key={log.id} className="audit-item">
                <span className="audit-action" style={getActionStyle(log.action)}>{log.action}</span>
                <span className="audit-details">{log.details}</span>
                <div className="audit-meta">
                  <div>{log.admin_username}</div>
                  <div>{new Date(log.created_at).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
          {hasMore && (
            <div style={{textAlign:'center',padding:'16px 0'}}>
              <button onClick={loadMore} disabled={loading} className="btn btn-ghost btn-sm">
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
