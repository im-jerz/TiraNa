import { useState, useEffect, useCallback } from 'react'
import { getAdmins, createAdmin, updateAdmin, deleteAdmin } from '../../api/admin'

export default function AdminManagement() {
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [creating, setCreating] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [toggling, setToggling] = useState(null)
  const [search, setSearch] = useState('')

  const fetchAdmins = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const data = await getAdmins()
      setAdmins(data)
    } catch (err) {
      setError(err.message || 'Failed to load admins')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAdmins() }, [fetchAdmins])

  const handleCreate = async () => {
    setCreating(true)
    setError('')
    try {
      await createAdmin(form)
      setShowCreate(false)
      setForm({ username: '', email: '', password: '' })
      await fetchAdmins()
    } catch (err) {
      setError(err.message || 'Failed to create admin')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    setError('')
    try {
      await deleteAdmin(deleteTarget.id)
      setDeleteTarget(null)
      await fetchAdmins()
    } catch (err) {
      setError(err.message || 'Failed to delete admin')
    } finally {
      setDeleting(false)
    }
  }

  const toggleActive = async (admin) => {
    setToggling(admin.id)
    setError('')
    try {
      await updateAdmin(admin.id, { is_active: !admin.is_active })
      await fetchAdmins()
    } catch (err) {
      setError(err.message || 'Failed to update admin status')
    } finally {
      setToggling(null)
    }
  }

  const filtered = admins.filter(a =>
    a.username.toLowerCase().includes(search.toLowerCase()) ||
    a.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Admin Management</h1>
        <div className="page-actions">
          <button onClick={() => setShowCreate(true)} className="btn btn-brand">+ New Admin</button>
        </div>
      </div>

      {error && (
        <div className="alert-strip alert-danger" style={{ marginBottom: 16 }}>
          <div className="alert-strip-content">
            <p>Error</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Search admins by username or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-input"
          style={{ maxWidth: 400 }}
        />
      </div>

      <div className="table-container">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Loading admins...</div>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Password Changed</th>
                  <th>Created</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>
                      {search ? 'No admins match your search.' : 'No admins found.'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((a) => (
                    <tr key={a.id}>
                      <td className="td-id">{a.id}</td>
                      <td className="td-main">{a.username}</td>
                      <td className="td-muted">{a.email}</td>
                      <td>
                        <button
                          onClick={() => toggleActive(a)}
                          disabled={toggling === a.id}
                          className={`badge ${a.is_active ? 'badge-active' : 'badge-pending'}`}
                          style={{ border: 'none', cursor: toggling === a.id ? 'wait' : 'pointer', opacity: toggling === a.id ? 0.6 : 1 }}
                        >
                          {toggling === a.id ? 'Updating...' : (a.is_active ? 'Active' : 'Inactive')}
                        </button>
                      </td>
                      <td>
                        <span className={`badge ${a.password_changed ? 'badge-active' : 'badge-pending'}`}>
                          {a.password_changed ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="td-muted">{new Date(a.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="td-actions">
                          <button
                            onClick={() => setDeleteTarget(a)}
                            className="btn btn-danger btn-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div className="pagination">
              <div className="pagination-info">{admins.length} admin(s)</div>
            </div>
          </>
        )}
      </div>

      {showCreate && (
        <div className="modal-overlay open" onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false) }}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">New Admin</h2>
              <button onClick={() => setShowCreate(false)} className="modal-close">&times;</button>
            </div>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                placeholder="Username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowCreate(false)} disabled={creating} className="btn btn-ghost">Cancel</button>
              <button
                onClick={handleCreate}
                disabled={creating || !form.username || !form.email || !form.password}
                className="btn btn-brand"
              >
                {creating ? 'Creating...' : 'Create Admin'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="modal-overlay open" onClick={(e) => { if (e.target === e.currentTarget) setDeleteTarget(null) }}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Delete Admin</h2>
              <button onClick={() => setDeleteTarget(null)} className="modal-close">&times;</button>
            </div>
            <p style={{ textAlign: 'center', fontSize: 14, color: '#6b7280', marginBottom: 8 }}>
              Are you sure you want to delete <strong>{deleteTarget.username}</strong>?
            </p>
            <p style={{ textAlign: 'center', fontSize: 13, color: '#ef4444', marginBottom: 8 }}>
              This action cannot be undone.
            </p>
            <div className="modal-footer">
              <button onClick={() => setDeleteTarget(null)} disabled={deleting} className="btn btn-ghost">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="btn btn-danger">
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
