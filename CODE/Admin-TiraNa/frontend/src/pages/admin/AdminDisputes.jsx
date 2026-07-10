import { useState, useEffect, useCallback } from 'react'
import { getDisputes, updateDispute } from '../../api/admin'

export default function AdminDisputes() {
  const [disputes, setDisputes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState(null)
  const [update, setUpdate] = useState({})

  const fetchDisputes = useCallback(async () => {
    setLoading(true)
    try { setDisputes(await getDisputes({ status: statusFilter })) }
    catch (err) { setError(err.message) }
    setLoading(false)
  }, [statusFilter])

  useEffect(() => { fetchDisputes() }, [fetchDisputes])

  useEffect(() => {
    if (selected) {
      setUpdate({ status: selected.status, resolution: selected.resolution || '', resolved_by: selected.resolved_by || '' })
    }
  }, [selected])

  const handleUpdate = async () => {
    try {
      await updateDispute(selected.id, update)
      setSelected(null)
      fetchDisputes()
    } catch (err) { setError(err.message) }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Disputes</h1>
        <div className="page-actions">
          <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="in-review">In Review</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="alert-strip alert-danger" style={{ marginBottom: 16 }}>
          <div className="alert-strip-content"><p>{error}</p></div>
        </div>
      )}

      <div className="table-container">
        {loading ? (
          <div className="loader"><div className="spin" /></div>
        ) : disputes.length === 0 ? (
          <div className="empty-state">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p>No disputes found.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Filed By</th>
                <th>Reason</th>
                <th>Booking</th>
                <th>Status</th>
                <th>Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {disputes.map((d) => (
                <tr key={d.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(d)}>
                  <td className="td-id">{d.id}</td>
                  <td className="td-muted">{d.filed_by}</td>
                  <td><div className="td-main" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.reason}</div></td>
                  <td className="td-muted">{d.booking_external_id || '—'}</td>
                  <td><span className={`badge badge-${d.status}`}>{d.status}</span></td>
                  <td className="td-muted">{new Date(d.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="td-actions">
                      <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); setSelected(d) }}>View</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Dispute Management Modal */}
      <div className={`modal-overlay ${selected ? 'open' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) setSelected(null) }}>
        <div className="modal modal-lg">
          <div className="modal-header">
            <h2 className="modal-title">Dispute #{selected?.id}</h2>
            <button className="modal-close" onClick={() => setSelected(null)}>✕</button>
          </div>
          {selected && (
            <>
              <div className="info-grid">
                <div className="info-item"><p>Filed By</p><p>{selected.filed_by} ({selected.filed_by_email})</p></div>
                <div className="info-item"><p>Booking</p><p>{selected.booking_external_id || 'N/A'}</p></div>
                <div className="info-item" style={{ gridColumn: '1 / -1' }}><p>Reason</p><p>{selected.reason}</p></div>
                {selected.evidence && <div className="info-item" style={{ gridColumn: '1 / -1' }}><p>Evidence</p><p>{selected.evidence}</p></div>}
              </div>
              <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label className="form-label">Status</label>
                  <select className="form-select" value={update.status || ''} onChange={(e) => setUpdate({ ...update, status: e.target.value })}>
                    <option value="open">Open</option>
                    <option value="in-review">In Review</option>
                    <option value="resolved">Resolved</option>
                    <option value="dismissed">Dismissed</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Resolved By</label>
                  <input className="form-input" type="text" value={update.resolved_by || ''} onChange={(e) => setUpdate({ ...update, resolved_by: e.target.value })} placeholder="Admin name..." />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Resolution Notes</label>
                <textarea className="form-textarea" value={update.resolution || ''} onChange={(e) => setUpdate({ ...update, resolution: e.target.value })} placeholder="Resolution details..." />
              </div>
              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={() => setSelected(null)}>Cancel</button>
                <button className="btn btn-brand" onClick={handleUpdate}>Save Changes</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
