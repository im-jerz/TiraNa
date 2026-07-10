import { useState } from 'react'

const MOCK_ADMINS = [
  { id: 1, username: 'superadmin', email: 'super@tirana.ph', is_active: true, created_at: '2024-01-01' },
  { id: 2, username: 'admin_juan', email: 'juan.admin@tirana.ph', is_active: true, created_at: '2024-02-15' },
  { id: 3, username: 'admin_ana', email: 'ana.admin@tirana.ph', is_active: false, created_at: '2024-03-20' },
]

export default function AdminManagement() {
  const [admins, setAdmins] = useState(MOCK_ADMINS)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [inviteForm, setInviteForm] = useState({ username: '', email: '' })
  const [creating, setCreating] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const handleCreate = () => {
    setCreating(true)
    const newAdmin = {
      id: Math.max(...admins.map(a => a.id), 0) + 1,
      username: form.username,
      email: form.email,
      is_active: true,
      created_at: new Date().toISOString().split('T')[0],
    }
    setAdmins(prev => [...prev, newAdmin])
    setShowCreate(false)
    setForm({ username: '', email: '', password: '' })
    setCreating(false)
  }

  const handleInvite = () => {
    setInviting(true)
    const newAdmin = {
      id: Math.max(...admins.map(a => a.id), 0) + 1,
      username: inviteForm.username,
      email: inviteForm.email,
      is_active: true,
      created_at: new Date().toISOString().split('T')[0],
    }
    setAdmins(prev => [...prev, newAdmin])
    setShowInvite(false)
    setInviteForm({ username: '', email: '' })
    setInviting(false)
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    setDeleting(true)
    setAdmins(prev => prev.filter(a => a.id !== deleteTarget.id))
    setDeleteTarget(null)
    setDeleting(false)
  }

  const toggleActive = (admin) => {
    setAdmins(prev => prev.map(a => a.id === admin.id ? { ...a, is_active: !a.is_active } : a))
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
