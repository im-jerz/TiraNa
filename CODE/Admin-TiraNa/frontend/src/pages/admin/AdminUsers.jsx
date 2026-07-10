import { useState, useEffect, useCallback } from 'react'
import { getAdminUsers, deleteAdminUser } from '../../api/admin'
import { useDebounce } from '../../hooks/useDebounce'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 500)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [detailUser, setDetailUser] = useState(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getAdminUsers({ search: debouncedSearch })
      setUsers(data)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }, [debouncedSearch])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteAdminUser(deleteTarget.id)
      setDeleteTarget(null)
      fetchUsers()
    } catch (err) {
      setError(err.message)
    }
    setDeleting(false)
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Users Management</h1>
        </div>
        <div className="page-actions">
          <input
            className="filter-input"
            placeholder="Search by username or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7}>
                  <div className="loader"><div className="spin"></div></div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" /></svg>
                    <p>{search ? 'No users match your search.' : 'No users registered yet.'}</p>
                  </div>
                </td>
              </tr>
            ) : users.map(user => (
              <tr key={user.id}>
                <td className="td-id">#{user.id}</td>
                <td className="td-main">{user.username}</td>
                <td className="td-muted">{user.email}</td>
                <td><span className={`badge badge-${user.role === 'Host' ? 'active' : 'completed'}`}>{user.role}</span></td>
                <td><span className={`badge badge-${user.is_verified ? 'verified' : 'pending'}`}>{user.is_verified ? 'Verified' : 'Pending'}</span></td>
                <td className="td-muted">{new Date(user.created_at).toLocaleDateString()}</td>
                <td>
                  <div className="td-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => setDetailUser(user)}>View</button>
                    <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(user)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* User Detail Modal */}
      <div className={`modal-overlay ${detailUser ? 'open' : ''}`} onClick={() => setDetailUser(null)}>
        <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2 className="modal-title">User Profile</h2>
            <button className="modal-close" onClick={() => setDetailUser(null)}>×</button>
          </div>
          {detailUser && (
            <>
              <div className="user-avatar-group">
                <div className="user-avatar-lg">{detailUser.username?.[0]?.toUpperCase()}</div>
                <div className="user-avatar-name">{detailUser.username}</div>
                <div className="user-avatar-email">{detailUser.email}</div>
                <span className={`badge badge-${detailUser.role === 'Host' ? 'active' : 'completed'}`}>{detailUser.role}</span>
                <span className={`badge badge-${detailUser.is_verified ? 'verified' : 'pending'}`}>
                  {detailUser.is_verified ? 'Verified' : 'Pending'}
                </span>
              </div>
              <div className="info-grid">
                <div className="info-item">
                  <p>User ID</p>
                  <p>#{detailUser.id}</p>
                </div>
                <div className="info-item">
                  <p>Registration Date</p>
                  <p>{new Date(detailUser.created_at).toLocaleString()}</p>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={() => setDetailUser(null)}>Close</button>
                <button className="btn btn-danger" onClick={() => { setDetailUser(null); setDeleteTarget(detailUser); }}>Delete Account</button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <div className={`modal-overlay ${deleteTarget ? 'open' : ''}`} onClick={() => setDeleteTarget(null)}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2 className="modal-title">Delete User Account</h2>
            <button className="modal-close" onClick={() => setDeleteTarget(null)}>×</button>
          </div>
          {deleteTarget && (
            <>
              <div className="alert-strip alert-danger">
                <div className="alert-strip-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div className="alert-strip-content">
                  <p>This action is permanent and cannot be undone. All data associated with <strong>{deleteTarget.username}</strong> will be lost.</p>
                </div>
              </div>
              <div style={{ textAlign: 'center', margin: '16px 0' }}>
                <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Are you sure you want to delete this user?</p>
                <p style={{ fontSize: '16px', fontWeight: '700', color: 'var(--dark)' }}>{deleteTarget.email}</p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</button>
                <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>{deleting ? 'Deleting...' : 'Permanently Delete'}</button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
