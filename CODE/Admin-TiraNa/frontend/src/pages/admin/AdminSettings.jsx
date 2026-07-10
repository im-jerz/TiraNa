import { useState, useEffect, useCallback } from 'react'
import { getSettings, updateSetting } from '../../api/admin'

const SETTING_CONFIG = {
  platform_name: {
    label: 'Platform Name',
    section: 'general',
    type: 'text',
    placeholder: 'TiraNa',
  },
  support_email: {
    label: 'Support Email',
    section: 'general',
    type: 'email',
    placeholder: 'support@example.com',
  },
  commission_percentage: {
    label: 'Commission Percentage',
    section: 'financial',
    type: 'number',
    min: 0,
    max: 100,
    suffix: '%',
    placeholder: '10',
  },
  min_payout_amount: {
    label: 'Minimum Payout',
    section: 'financial',
    type: 'number',
    min: 0,
    suffix: 'PHP',
    placeholder: '500',
  },
  max_refund_days: {
    label: 'Max Refund Days',
    section: 'financial',
    type: 'number',
    min: 1,
    max: 365,
    suffix: 'days',
    placeholder: '30',
  },
  paymongo_secret_key: {
    label: 'Secret Key',
    section: 'paymongo',
    type: 'password',
    placeholder: 'sk_test_...',
  },
  paymongo_public_key: {
    label: 'Public Key',
    section: 'paymongo',
    type: 'password',
    placeholder: 'pk_test_...',
  },
  paymongo_webhook_secret: {
    label: 'Webhook Secret',
    section: 'paymongo',
    type: 'password',
    placeholder: 'whsec_...',
  },
}

const SECTIONS = [
  { id: 'general', label: 'General', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
  { id: 'financial', label: 'Financial', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { id: 'paymongo', label: 'PayMongo', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
]

export default function AdminSettings() {
  const [settings, setSettings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editKey, setEditKey] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [showSecrets, setShowSecrets] = useState({})
  const [validationError, setValidationError] = useState('')

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    try { setSettings(await getSettings()) }
    catch (err) { setError(err.message) }
    setLoading(false)
  }, [])

  useEffect(() => { fetchSettings() }, [fetchSettings])

  const validate = (key, value) => {
    const config = SETTING_CONFIG[key]
    if (!config) return ''

    if (config.type === 'number') {
      const num = parseFloat(value)
      if (isNaN(num)) return 'Must be a valid number'
      if (config.min !== undefined && num < config.min) return `Minimum value is ${config.min}`
      if (config.max !== undefined && num > config.max) return `Maximum value is ${config.max}`
    }

    if (config.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) return 'Must be a valid email address'
    }

    return ''
  }

  const handleSave = async () => {
    if (!editKey) return

    const valErr = validate(editKey, editValue)
    if (valErr) {
      setValidationError(valErr)
      return
    }

    setSaving(true)
    setValidationError('')
    try {
      const setting = settings.find((s) => s.key === editKey)
      await updateSetting(editKey, editValue, setting?.description)
      setEditKey(null)
      setSuccess('Setting saved successfully')
      setTimeout(() => setSuccess(''), 3000)
      fetchSettings()
    } catch (err) { setError(err.message) }
    setSaving(false)
  }

  const toggleSecret = (key) => {
    setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const getDisplayValue = (setting) => {
    const config = SETTING_CONFIG[setting.key]
    if (config?.type === 'password' && !showSecrets[setting.key]) {
      return setting.value ? '••••••••' : '—'
    }
    if (setting.value && config?.suffix) {
      return `${setting.value} ${config.suffix}`
    }
    return setting.value || '—'
  }

  const groupedSettings = SECTIONS.map((section) => ({
    ...section,
    settings: settings.filter((s) => SETTING_CONFIG[s.key]?.section === section.id),
  })).filter((section) => section.settings.length > 0)

  return (
    <div style={{maxWidth:720}}>
      <div className="page-header">
        <div>
          <h1 className="page-title">System Settings</h1>
          <p className="page-subtitle">Manage platform configuration and integrations</p>
        </div>
      </div>

      {error && <div className="alert-strip alert-danger" style={{marginBottom:16}}><div className="alert-strip-content"><p>Error</p><p>{error}</p></div></div>}
      {success && <div className="alert-strip alert-success" style={{marginBottom:16}}><div className="alert-strip-content"><p>Success</p><p>{success}</p></div></div>}

      {loading ? (
        <div className="loader"><div className="spin" /></div>
      ) : (
        <div>
          {groupedSettings.map((section) => (
            <div key={section.id} className="settings-section">
              <div className="settings-section-header">
                <div className="settings-section-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={section.icon} />
                  </svg>
                </div>
                <h2 className="settings-section-title">{section.label}</h2>
              </div>
              {section.settings.map((s) => {
                const config = SETTING_CONFIG[s.key] || {}
                const isEditing = editKey === s.key
                const isPassword = config.type === 'password'

                return (
                  <div key={s.key} className="settings-row">
                    <div style={{flex:1,minWidth:0}}>
                      <div className="settings-row-label">{config.label || s.key}</div>
                      {s.description && <div style={{fontSize:11,color:'#9ca3af',marginTop:2}}>{s.description}</div>}
                    </div>
                    {isEditing ? (
                      <div className="settings-row-actions" style={{flexWrap:'wrap',justifyContent:'flex-end'}}>
                        <div style={{position:'relative'}}>
                          <input
                            type={isPassword && !showSecrets[s.key] ? 'password' : 'text'}
                            value={editValue}
                            onChange={(e) => { setEditValue(e.target.value); setValidationError('') }}
                            min={config.min}
                            max={config.max}
                            placeholder={config.placeholder}
                            className="form-input"
                            style={{width:200}}
                          />
                          {isPassword && (
                            <button
                              type="button"
                              onClick={() => toggleSecret(s.key)}
                              style={{position:'absolute',right:6,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#6b7280',padding:4}}
                            >
                              <svg width={16} height={16} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {showSecrets[s.key] ? (
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                ) : (
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                )}
                              </svg>
                            </button>
                          )}
                          {validationError && <div className="form-error show">{validationError}</div>}
                        </div>
                        <button onClick={handleSave} disabled={saving} className="btn btn-brand btn-sm">{saving ? 'Saving...' : 'Save'}</button>
                        <button onClick={() => { setEditKey(null); setValidationError('') }} className="btn btn-ghost btn-sm">Cancel</button>
                      </div>
                    ) : (
                      <div className="settings-row-actions">
                        <span className="settings-row-value">{getDisplayValue(s)}</span>
                        {isPassword && s.value && (
                          <button
                            onClick={() => toggleSecret(s.key)}
                            className="btn btn-ghost btn-sm"
                            title={showSecrets[s.key] ? 'Hide' : 'Show'}
                            style={{minWidth:0,padding:'5px 6px'}}
                          >
                            <svg width={14} height={14} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              {showSecrets[s.key] ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                              ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              )}
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => { setEditKey(s.key); setEditValue(s.value || ''); setValidationError('') }}
                          className="btn btn-ghost btn-sm"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
