import { useState } from 'react'

const MOCK_LOGS = [
  { id: 1, action: 'APPROVE_LISTING', details: 'Approved listing Villa (#1)', admin_username: 'superadmin', created_at: '2024-06-25 14:30:00' },
  { id: 2, action: 'CANCEL_BOOKING', details: 'Cancelled booking #1005', admin_username: 'admin_juan', created_at: '2024-06-24 10:15:00' },
  { id: 3, action: 'REFUND_PAYMENT', details: 'Refunded P3200 for payment #5004', admin_username: 'admin_ana', created_at: '2024-06-23 16:45:00' },
  { id: 4, action: 'DELETE_USER', details: 'Deleted user spam (#892)', admin_username: 'superadmin', created_at: '2024-06-22 09:00:00' },
  { id: 5, action: 'UPDATE_SETTING', details: 'Updated commission 8% to 10%', admin_username: 'superadmin', created_at: '2024-06-20 11:30:00' },
]

export default function AdminAudit() {
  const [logs] = useState(MOCK_LOGS)
  const [actionFilter, setActionFilter] = useState('')

  const filteredLogs = logs.filter(l => !actionFilter || l.action === actionFilter)

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
            <option value="APPROVE_LISTING">Approve Listing</option>
            <option value="REJECT_LISTING">Reject Listing</option>
            <option value="SUSPEND_LISTING">Suspend Listing</option>
            <option value="CANCEL_BOOKING">Cancel Booking</option>
            <option value="REFUND_PAYMENT">Refund Payment</option>
            <option value="HIDE_REVIEW">Hide Review</option>
            <option value="SHOW_REVIEW">Show Review</option>
            <option value="UPDATE_TICKET">Update Ticket</option>
            <option value="UPDATE_DISPUTE">Update Dispute</option>
            <option value="APPROVE_WITHDRAWAL">Approve Withdrawal</option>
            <option value="REJECT_WITHDRAWAL">Reject Withdrawal</option>
            <option value="UPDATE_SETTING">Update Setting</option>
            <option value="CREATE_ADMIN">Create Admin</option>
            <option value="UPDATE_ADMIN">Update Admin</option>
            <option value="DELETE_ADMIN">Delete Admin</option>
            <option value="DELETE_USER">Delete User</option>
          </select>
        </div>
      </div>

      {filteredLogs.length === 0 ? (
        <div className="empty-state">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
          <p>No audit logs found.</p>
        </div>
      ) : (
        <div className="audit-list">
          {filteredLogs.map((log) => (
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
      )}
    </div>
  )
}
