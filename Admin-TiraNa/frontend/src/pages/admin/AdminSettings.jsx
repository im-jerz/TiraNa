import { useState, useEffect } from 'react'
import { getMyProfile, updateMyProfile, changePassword } from '../../api/admin'

export default function AdminSettings() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [editingField, setEditingField] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)

  const [showChangePassword, setShowChangePassword] = useState(false)
  const [passwords, setPasswords] = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [passwordError, setPasswordError] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await getMyProfile()
      setProfile(data)
    } catch (err) {
      setError(err.message || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!editingField || !editValue.trim()) return

    try {
      setSaving(true)
      setError('')
      const updated = await updateMyProfile({ [editingField]: editValue.trim() })
      setProfile(updated)
      setEditingField(null)
      setSuccess('Profile updated successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    setPasswordError('')

    if (!passwords.current_password || !passwords.new_password) {
      setPasswordError('Please fill in all fields')
      return
    }
    if (passwords.new_password.length < 6) {
      setPasswordError('New password must be at least 6 characters')
      return
    }
    if (passwords.new_password !== passwords.confirm_password) {
      setPasswordError('New passwords do not match')
      return
    }

    try {
      setChangingPassword(true)
      await changePassword({
        current_password: passwords.current_password,
        new_password: passwords.new_password,
      })
      setShowChangePassword(false)
      setPasswords({ current_password: '', new_password: '', confirm_password: '' })
      setSuccess('Password changed successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password')
    } finally {
      setChangingPassword(false)
    }
  }

  if (loading) {
    return (
      <div style={{display:'flex',justifyContent:'center',padding:'60px 0'}}>
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div style={{maxWidth:640}}>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Account</h1>
          <p className="page-subtitle">Manage your account settings</p>
        </div>
      </div>

      {error && <div className="alert-strip alert-danger" style={{marginBottom:16}}><div className="alert-strip-content"><p>Error</p><p>{error}</p></div></div>}
      {success && <div className="alert-strip alert-success" style={{marginBottom:16}}><div className="alert-strip-content"><p>Success</p><p>{success}</p></div></div>}

      {profile && (
        <div className="settings-section">
          <div className="settings-section-header">
            <div className="settings-section-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="settings-section-title">Profile</h2>
          </div>

          {/* Username */}
          <div className="settings-row">
            <div style={{flex:1,minWidth:0}}>
              <div className="settings-row-label">Username</div>
              <div style={{fontSize:11,color:'#9ca3af',marginTop:2}}>Your display name</div>
            </div>
            {editingField === 'username' ? (
              <div className="settings-row-actions" style={{flexWrap:'wrap',justifyContent:'flex-end'}}>
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="form-input"
                  style={{width:200}}
                  minLength={3}
                />
                <button onClick={handleSaveProfile} disabled={saving} className="btn btn-brand btn-sm">
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button onClick={() => setEditingField(null)} className="btn btn-ghost btn-sm">Cancel</button>
              </div>
            ) : (
              <div className="settings-row-actions">
                <span className="settings-row-value">{profile.username}</span>
                <button
                  onClick={() => { setEditingField('username'); setEditValue(profile.username) }}
                  className="btn btn-ghost btn-sm"
                >
                  Edit
                </button>
              </div>
            )}
          </div>

          {/* Email */}
          <div className="settings-row">
            <div style={{flex:1,minWidth:0}}>
              <div className="settings-row-label">Email</div>
              <div style={{fontSize:11,color:'#9ca3af',marginTop:2}}>Your email address</div>
            </div>
            {editingField === 'email' ? (
              <div className="settings-row-actions" style={{flexWrap:'wrap',justifyContent:'flex-end'}}>
                <input
                  type="email"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="form-input"
                  style={{width:200}}
                />
                <button onClick={handleSaveProfile} disabled={saving} className="btn btn-brand btn-sm">
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button onClick={() => setEditingField(null)} className="btn btn-ghost btn-sm">Cancel</button>
              </div>
            ) : (
              <div className="settings-row-actions">
                <span className="settings-row-value">{profile.email}</span>
                <button
                  onClick={() => { setEditingField('email'); setEditValue(profile.email) }}
                  className="btn btn-ghost btn-sm"
                >
                  Edit
                </button>
              </div>
            )}
          </div>

          {/* Role */}
          <div className="settings-row">
            <div style={{flex:1,minWidth:0}}>
              <div className="settings-row-label">Role</div>
              <div style={{fontSize:11,color:'#9ca3af',marginTop:2}}>Your account role</div>
            </div>
            <div className="settings-row-actions">
              <span className="settings-row-value">Admin</span>
            </div>
          </div>
        </div>
      )}

      {/* Password Section */}
      <div className="settings-section" style={{marginTop:24}}>
        <div className="settings-section-header">
          <div className="settings-section-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="settings-section-title">Security</h2>
        </div>

        <div className="settings-row">
          <div style={{flex:1,minWidth:0}}>
            <div className="settings-row-label">Password</div>
            <div style={{fontSize:11,color:'#9ca3af',marginTop:2}}>Last changed: {profile?.password_changed ? 'Yes' : 'Never'}</div>
          </div>
          <div className="settings-row-actions">
            <button
              onClick={() => setShowChangePassword(!showChangePassword)}
              className="btn btn-ghost btn-sm"
            >
              {showChangePassword ? 'Cancel' : 'Change Password'}
            </button>
          </div>
        </div>

        {showChangePassword && (
          <div style={{padding:'16px 20px',background:'#f9fafb',borderRadius:8,marginTop:8}}>
            {passwordError && <div style={{color:'#dc2626',fontSize:13,marginBottom:12}}>{passwordError}</div>}

            <div style={{marginBottom:12}}>
              <label style={{display:'block',fontSize:13,fontWeight:500,marginBottom:4}}>Current Password</label>
              <input
                type="password"
                value={passwords.current_password}
                onChange={(e) => setPasswords(p => ({...p, current_password: e.target.value}))}
                className="form-input"
                style={{width:'100%'}}
              />
            </div>

            <div style={{marginBottom:12}}>
              <label style={{display:'block',fontSize:13,fontWeight:500,marginBottom:4}}>New Password</label>
              <input
                type="password"
                value={passwords.new_password}
                onChange={(e) => setPasswords(p => ({...p, new_password: e.target.value}))}
                className="form-input"
                style={{width:'100%'}}
                minLength={6}
              />
            </div>

            <div style={{marginBottom:16}}>
              <label style={{display:'block',fontSize:13,fontWeight:500,marginBottom:4}}>Confirm New Password</label>
              <input
                type="password"
                value={passwords.confirm_password}
                onChange={(e) => setPasswords(p => ({...p, confirm_password: e.target.value}))}
                className="form-input"
                style={{width:'100%'}}
              />
            </div>

            <button
              onClick={handleChangePassword}
              disabled={changingPassword}
              className="btn btn-brand btn-sm"
            >
              {changingPassword ? 'Changing...' : 'Update Password'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
