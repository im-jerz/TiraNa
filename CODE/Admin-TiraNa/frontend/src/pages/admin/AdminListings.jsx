import { useState, useEffect, useCallback } from 'react'
import { getProperties, updatePropertyStatus } from '../../api/host'

const STATUS_MAP = {
  active: 'approved',
  inactive: 'pending',
  suspended: 'suspended',
}

const REVERSE_STATUS = {
  approve: 'active',
  reject: 'inactive',
  suspend: 'suspended',
}

export default function AdminListings() {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [actionModal, setActionModal] = useState(null)
  const [actionType, setActionType] = useState('')
  const [actionReason, setActionReason] = useState('')
  const [acting, setActing] = useState(false)
  const [detailListing, setDetailListing] = useState(null)

  const fetchListings = useCallback(async () => {
    setLoading(true)
    try {
      const properties = await getProperties({ search, limit: 100 })
      setListings(properties)
    } catch (err) {
      console.error('Failed to fetch listings:', err)
      setListings([])
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    const timer = setTimeout(() => fetchListings(), 300)
    return () => clearTimeout(timer)
  }, [fetchListings])

  const filteredListings = listings.filter(l => {
    const displayStatus = STATUS_MAP[l.status] || l.status
    const matchesSearch = (l.name || '').toLowerCase().includes(search.toLowerCase()) || (l.host_email || '').toLowerCase().includes(search.toLowerCase())
    const matchesStatus = !statusFilter || displayStatus === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleAction = async () => {
    if (!actionModal) return
    setActing(true)
    try {
      const newStatus = REVERSE_STATUS[actionType]
      await updatePropertyStatus(actionModal.id, newStatus)
      setListings(prev => prev.map(l =>
        l.id === actionModal.id ? { ...l, status: newStatus } : l
      ))
    } catch (err) {
      console.error('Failed to update listing status:', err)
    } finally {
      setActionModal(null)
      setActionReason('')
      setActing(false)
    }
  }

  const openAction = (listing, type) => {
    setActionModal(listing)
    setActionType(type)
    setActionReason('')
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Listings Moderation</h1>
        <div className="page-actions">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="suspended">Suspended</option>
          </select>
          <input type="text" placeholder="Search listings..." value={search} onChange={(e) => setSearch(e.target.value)} className="filter-input" />
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="empty-state"><p>Loading listings...</p></div>
        ) : filteredListings.length === 0 ? (
          <div className="empty-state">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            <p>No listings found matching your criteria.</p>
          </div>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Host</th>
                  <th>Price/Night</th>
                  <th>Status</th>
                  <th style={{textAlign:'right'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredListings.map((l) => {
                  const displayStatus = STATUS_MAP[l.status] || l.status
                  return (
                    <tr key={l.id}>
                      <td className="td-id">#{l.id}</td>
                      <td><div className="td-main">{l.name || l.title}</div></td>
                      <td className="td-muted">{l.host_email || l.host_name || '—'}</td>
                      <td className="td-amount">{l.price_per_night ? `₱${Number(l.price_per_night).toLocaleString()}` : '—'}</td>
                      <td><span className={`badge badge-${displayStatus}`}>{displayStatus}</span></td>
                      <td>
                        <div className="td-actions">
                          <button onClick={() => setDetailListing(l)} className="btn btn-ghost btn-sm">View</button>
                          {displayStatus === 'pending' && (
                            <>
                              <button onClick={() => openAction(l, 'approve')} className="btn btn-brand btn-sm">Approve</button>
                              <button onClick={() => openAction(l, 'reject')} className="btn btn-ghost btn-sm">Reject</button>
                            </>
                          )}
                          {(displayStatus === 'approved' || displayStatus === 'pending') && (
                            <button onClick={() => openAction(l, 'suspend')} className="btn btn-danger btn-sm">Suspend</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div className="pagination">
              <div className="pagination-info">{filteredListings.length} listing(s)</div>
            </div>
          </>
        )}
      </div>

      {detailListing && (
        <div className="modal-overlay open">
          <div className="modal modal-lg">
            <div className="modal-header">
              <h2 className="modal-title">Listing Details</h2>
              <button onClick={() => setDetailListing(null)} className="modal-close">&times;</button>
            </div>
            <div style={{aspectRatio:'16/9',width:'100%',borderRadius:12,overflow:'hidden',background:'#f3f4f6',border:'1px solid var(--gray-light)',marginBottom:16}}>
              {detailListing.cover_photo ? (
                <img src={detailListing.cover_photo} style={{width:'100%',height:'100%',objectFit:'cover'}} alt={detailListing.name || detailListing.title} />
              ) : (
                <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',color:'#9ca3af',fontWeight:700}}>No Preview Image</div>
              )}
            </div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
              <div>
                <h2 style={{fontSize:20,fontWeight:900,color:'var(--dark)',marginBottom:4}}>{detailListing.name || detailListing.title}</h2>
                <p style={{fontSize:13,color:'#6b7280',fontWeight:500,display:'flex',alignItems:'center',gap:4}}>
                  <svg width={16} height={16} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  {detailListing.location || 'Location not specified'}
                </p>
              </div>
              <span className={`badge badge-${STATUS_MAP[detailListing.status] || detailListing.status}`}>{STATUS_MAP[detailListing.status] || detailListing.status}</span>
            </div>
            <div className="info-grid">
              <div className="info-item">
                <p>Host Information</p>
                <p>{detailListing.host_email || detailListing.host_name || '—'}</p>
              </div>
              <div className="info-item">
                <p>Pricing</p>
                <p style={{color:'var(--brand)',fontSize:20}}>₱{Number(detailListing.price_per_night).toLocaleString()}</p>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setDetailListing(null)} className="btn btn-ghost">Close</button>
              {(STATUS_MAP[detailListing.status] || detailListing.status) === 'pending' && (
                <button onClick={() => { setDetailListing(null); openAction(detailListing, 'approve'); }} className="btn btn-brand">Approve Listing</button>
              )}
            </div>
          </div>
        </div>
      )}

      {actionModal && (
        <div className="modal-overlay open">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{actionType.charAt(0).toUpperCase() + actionType.slice(1)} Listing</h2>
              <button onClick={() => setActionModal(null)} className="modal-close">&times;</button>
            </div>
            <p style={{fontSize:13,color:'#6b7280',marginBottom:16}}>
              You are about to <strong>{actionType}</strong> the listing:
              <br />
              <span style={{color:'var(--dark)',fontWeight:700}}>"{actionModal.name || actionModal.title}"</span>
            </p>
            {(actionType === 'reject' || actionType === 'suspend') && (
              <div className="form-group">
                <label className="form-label">Reason for {actionType}</label>
                <textarea value={actionReason} onChange={(e) => setActionReason(e.target.value)} placeholder="Explain why this action is being taken..." className="form-textarea" style={{minHeight:100}} />
              </div>
            )}
            <div className="modal-footer">
              <button onClick={() => setActionModal(null)} disabled={acting} className="btn btn-ghost">Cancel</button>
              <button onClick={handleAction} disabled={acting || (actionType !== 'approve' && !actionReason.trim())} className={`btn ${actionType === 'approve' ? 'btn-brand' : 'btn-danger'}`}>
                {acting ? 'Processing...' : `Confirm ${actionType.charAt(0).toUpperCase() + actionType.slice(1)}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
