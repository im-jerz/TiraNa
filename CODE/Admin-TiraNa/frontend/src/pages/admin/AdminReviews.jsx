import { useState, useEffect, useCallback } from 'react'
import { getReviews, hideReview, showReview } from '../../api/admin'
import { useDebounce } from '../../hooks/useDebounce'

export default function AdminReviews() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 500)
  const [acting, setActing] = useState(false)
  const [detailModal, setDetailModal] = useState(null)

  const fetchReviews = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getReviews({ search: debouncedSearch })
      setReviews(data)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }, [debouncedSearch])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  const handleToggleHide = async (review) => {
    setActing(true)
    try {
      if (review.is_hidden) {
        await showReview(review.id)
      } else {
        await hideReview(review.id)
      }
      fetchReviews()
      setDetailModal(null)
    } catch (err) {
      setError(err.message)
    }
    setActing(false)
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Reviews Moderation</h1>
        <div className="page-actions">
          <input type="text" placeholder="Search by reviewer or comment..." value={search} onChange={(e) => setSearch(e.target.value)} className="filter-input" />
        </div>
      </div>

      {error && <div className="alert-strip alert-danger" style={{marginBottom:16}}><div className="alert-strip-content"><p>Error</p><p>{error}</p></div></div>}

      <div className="table-container">
        {loading ? (
          <div className="loader"><div className="spin" /></div>
        ) : reviews.length === 0 ? (
          <div className="empty-state">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            <p>No reviews found matching your search.</p>
          </div>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>Rating</th>
                  <th>Reviewer</th>
                  <th>Comment</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th style={{textAlign:'right'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((r) => (
                  <tr key={r.id}>
                    <td><span className="td-main" style={{color:'var(--brand)'}}>{r.rating}</span></td>
                    <td className="td-main">{r.user_name || 'Anonymous'}</td>
                    <td style={{maxWidth:240}}><span className="td-muted" style={{display:'block',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.comment || '—'}</span></td>
                    <td><span className={`badge ${r.is_hidden ? 'badge-dismissed' : 'badge-active'}`}>{r.is_hidden ? 'Hidden' : 'Active'}</span></td>
                    <td className="td-muted">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="td-actions">
                        <button onClick={() => setDetailModal(r)} className="btn btn-ghost btn-sm">View & Moderate</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="pagination">
              <div className="pagination-info">{reviews.length} review(s)</div>
            </div>
          </>
        )}
      </div>

      {detailModal && (
        <div className="modal-overlay open">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Review Details</h2>
              <button onClick={() => setDetailModal(null)} className="modal-close">&times;</button>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:14,background:'#f9fafb',borderRadius:10,border:'1px solid var(--gray-light)',marginBottom:16}}>
              <div style={{display:'flex',alignItems:'center',gap:14}}>
                <div className="user-avatar-lg" style={{width:48,height:48,fontSize:18}}>
                  {detailModal.user_name?.[0] || 'A'}
                </div>
                <div>
                  <p style={{fontWeight:700,color:'var(--dark)',fontSize:16}}>{detailModal.user_name}</p>
                  <p style={{fontSize:12,color:'#6b7280'}}>{new Date(detailModal.created_at).toLocaleString()}</p>
                </div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:6,background:'#fff',padding:'6px 12px',borderRadius:8,border:'1px solid rgba(203,41,87,0.2)'}}>
                <span style={{color:'var(--brand)',fontWeight:900,fontSize:20}}>{detailModal.rating}</span>
                <svg width={20} height={20} fill="currentColor" style={{color:'var(--brand)'}} viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            </div>
            <div style={{marginBottom:16}}>
              <p style={{fontSize:10,fontWeight:900,color:'#9ca3af',textTransform:'uppercase',letterSpacing:'0.15em',marginBottom:6}}>Review Comment</p>
              <p style={{color:'var(--dark)',lineHeight:1.6,fontStyle:'italic',background:'#fff',padding:14,borderRadius:10,border:'1px solid var(--gray-light)'}}>
                "{detailModal.comment || 'No written comment provided.'}"
              </p>
            </div>
            <div style={{padding:14,borderRadius:10,border:'1px solid var(--gray-light)',display:'flex',alignItems:'center',justifyContent:'space-between',background:'#fff',marginBottom:16}}>
              <div>
                <p style={{fontSize:13,fontWeight:700,color:'var(--dark)'}}>Visibility Status</p>
                <p style={{fontSize:11,color:'#9ca3af'}}>
                  {detailModal.is_hidden ? 'This review is currently hidden from public view.' : 'This review is visible to all users.'}
                </p>
              </div>
              <span className={`badge ${detailModal.is_hidden ? 'badge-dismissed' : 'badge-active'}`}>{detailModal.is_hidden ? 'Hidden' : 'Active'}</span>
            </div>
            <div className="modal-footer">
              <button onClick={() => setDetailModal(null)} className="btn btn-ghost">Close</button>
              <button onClick={() => handleToggleHide(detailModal)} disabled={acting} className={`btn ${detailModal.is_hidden ? 'btn-brand' : 'btn-danger'}`}>
                {acting ? 'Processing...' : detailModal.is_hidden ? 'Show Review' : 'Hide Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
