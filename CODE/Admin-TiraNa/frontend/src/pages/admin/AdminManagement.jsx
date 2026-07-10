import { useState, useEffect, useCallback } from 'react'
import { getAdmins, createAdmin, updateAdmin, deleteAdmin, inviteAdmin } from '../../api/admin'

export default function AdminManagement() {
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [inviteForm, setInviteForm] = useState({ username: '', email: '' })
  const [creating, setCreating] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchAdmins = useCallback(async () => {
    setLoading(true)
    try { setAdmins(await getAdmins()) }
    catch (err) { setError(err.message) }
    setLoading(false)
  }, [])

  useEffect(() => { fetchAdmins() }, [fetchAdmins])

  const handleCreate = async () => {
    setCreating(true)
    try {
      await createAdmin(form.username, form.email, form.password)
      setShowCreate(false)
      setForm({ username: '', email: '', password: '' })
      fetchAdmins()
    } catch (err) { setError(err.message) }
    setCreating(false)
  }

  const handleInvite = async () => {
    setInviting(true)
    try {
      await inviteAdmin(inviteForm.username, inviteForm.email)
      setShowInvite(false)
      setInviteForm({ username: '', email: '' })
      fetchAdmins()
    } catch (err) { setError(err.message) }
    setInviting(false)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try { await deleteAdmin(deleteTarget.id); setDeleteTarget(null); fetchAdmins() }
    catch (err) { setError(err.message) }
    setDeleting(false)
  }

  const toggleActive = async (admin) => {
    try { await updateAdmin(admin.id, { is_active: !admin.is_active }); fetchAdmins() }
    catch (err) { setError(err.message) }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Admin Management</h1>
        <div className="page-actions">
          <button onClick={() => setShowInvite(true)} className="btn btn-ghost">+ Invite Admin</button>
          <button onClick={() => setShowCreate(true)} className="btn btn-brand">+ New Admin</button>
        </div>
      </div>

      {error && <div className="alert-strip alert-danger" style={{marginBottom:16}}><div className="alert-strip-content"><p>Error</p><p>{error}</p></div></div>}

      <div className="table-container">
        {loading ? (
          <div className="loader"><div className="spin" /></div>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th style={{textAlign:'right'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((a) => (
                  <tr key={a.id}>
                    <td className="td-id">{a.id}</td>
                    <td className="td-main">{a.username}</td>
                    <td className="td-muted">{a.email}</td>
                    <td>
                      <button onClick={() => toggleActive(a)} className={`badge ${a.is_active ? 'badge-active' : 'badge-pending'}`} style={{border:'none',cursor:'pointer'}}>
                        {a.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="td-muted">{new Date(a.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="td-actions">
                        <button onClick={() => setDeleteTarget(a)} className="btn btn-danger btn-sm">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="pagination">
              <div className="pagination-info">{admins.length} admin(s)</div>
            </div>
          </>
        )}
      </div>

      {showCreate && (
        <div className="modal-overlay open">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">New Admin (Manual)</h2>
              <button onClick={() => setShowCreate(false)} className="modal-close">&times;</button>
            </div>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input type="text" placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="form-input" />
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowCreate(false)} disabled={creating} className="btn btn-ghost">Cancel</button>
              <button onClick={handleCreate} disabled={creating || !form.username || !form.email || !form.password} className="btn btn-brand">{creating ? 'Creating...' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}

      {showInvite && (
        <div className="modal-overlay open">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Invite New Admin</h2>
              <button onClick={() => setShowInvite(false)} className="modal-close">&times;</button>
            </div>
            <p style={{fontSize:13,color:'#6b7280',marginBottom:16}}>An invitation code will be sent to the email address. The user will be able to set their own password.</p>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input type="text" placeholder="Username" value={inviteForm.username} onChange={(e) => setInviteForm({ ...inviteForm, username: e.target.value })} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" placeholder="Email" value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} className="form-input" />
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowInvite(false)} disabled={inviting} className="btn btn-ghost">Cancel</button>
              <button onClick={handleInvite} disabled={inviting || !inviteForm.username || !inviteForm.email} className="btn btn-brand">{inviting ? 'Sending Invite...' : 'Send Invitation'}</button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="modal-overlay open">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Delete Admin</h2>
              <button onClick={() => setDeleteTarget(null)} className="modal-close">&times;</button>
            </div>
            <p style={{textAlign:'center',fontSize:14,color:'#6b7280',marginBottom:8}}>Are you sure you want to delete <strong>{deleteTarget.username}</strong>?</p>
            <div className="modal-footer">
              <button onClick={() => setDeleteTarget(null)} disabled={deleting} className="btn btn-ghost">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="btn btn-danger">{deleting ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
