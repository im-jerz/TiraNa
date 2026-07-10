import { useState, useEffect, useCallback } from 'react'
import { getTickets, updateTicket } from '../../api/admin'

export default function AdminSupport() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [selected, setSelected] = useState(null)
  const [update, setUpdate] = useState({})

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    try { setTickets(await getTickets({ search, status: statusFilter, priority: priorityFilter })) }
    catch (err) { setError(err.message) }
    setLoading(false)
  }, [search, statusFilter, priorityFilter])

  useEffect(() => { fetchTickets() }, [fetchTickets])

  useEffect(() => {
    if (selected) {
      setUpdate({ status: selected.status, assigned_to: selected.assigned_to || '', priority: selected.priority, resolution: selected.resolution || '' })
    }
  }, [selected])

  const handleUpdate = async () => {
    try {
      await updateTicket(selected.id, update)
      setSelected(null)
      fetchTickets()
    } catch (err) { setError(err.message) }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Support Tickets</h1>
        <div className="page-actions">
          <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <select className="filter-select" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="">All Priority</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <input className="filter-input" type="text" placeholder="Search tickets..." value={search} onChange={(e) => setSearch(e.target.value)} />
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
        ) : tickets.length === 0 ? (
          <div className="empty-state">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
            <p>No tickets found.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Subject</th>
                <th>Requester</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Assigned</th>
                <th>Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(t)}>
                  <td className="td-id">#{t.id}</td>
                  <td><div className="td-main">{t.subject}</div></td>
                  <td className="td-muted">{t.requester_name || t.requester_email}</td>
                  <td className="td-muted">{t.category}</td>
                  <td><span className={`badge badge-${t.priority}`}>{t.priority}</span></td>
                  <td><span className={`badge badge-${t.status === 'in-progress' ? 'in-progress' : t.status}`}>{t.status}</span></td>
                  <td className="td-muted">{t.assigned_to || '—'}</td>
                  <td className="td-muted">{new Date(t.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="td-actions">
                      <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); setSelected(t) }}>Manage</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Ticket Management Modal */}
      <div className={`modal-overlay ${selected ? 'open' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) setSelected(null) }}>
        <div className="modal modal-lg">
          <div className="modal-header">
            <h2 className="modal-title">Ticket #{selected?.id}</h2>
            <button className="modal-close" onClick={() => setSelected(null)}>✕</button>
          </div>
          {selected && (
            <>
              <div className="info-grid">
                <div className="info-item"><p>Subject</p><p>{selected.subject}</p></div>
                <div className="info-item"><p>Requester</p><p>{selected.requester_name} ({selected.requester_email})</p></div>
                <div className="info-item"><p>Category</p><p>{selected.category}</p></div>
                <div className="info-item"><p>Created</p><p>{new Date(selected.created_at).toLocaleString()}</p></div>
              </div>
              <div className="card" style={{ marginBottom: 14 }}>
                <div className="card-title">Description</div>
                <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{selected.description}</p>
              </div>
              <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label className="form-label">Status</label>
                  <select className="form-select" value={update.status || ''} onChange={(e) => setUpdate({ ...update, status: e.target.value })}>
                    <option value="open">Open</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Priority</label>
                  <select className="form-select" value={update.priority || ''} onChange={(e) => setUpdate({ ...update, priority: e.target.value })}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Assigned To</label>
                <input className="form-input" type="text" value={update.assigned_to || ''} onChange={(e) => setUpdate({ ...update, assigned_to: e.target.value })} placeholder="Admin name..." />
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
