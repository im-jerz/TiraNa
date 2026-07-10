import { useState, useEffect, useCallback } from 'react'
import { getRooms, updateRoomStatus } from '../../api/admin'

export default function AdminRooms() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ status: '', search: '' })
  const [actionLoading, setActionLoading] = useState(false)

  const fetchRooms = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getRooms({ status: filter.status, search: filter.search, limit: 100 })
      setRooms(data.rooms || [])
    } catch (err) {
      console.error('Failed to fetch rooms:', err)
      setRooms([])
    } finally {
      setLoading(false)
    }
  }, [filter.status, filter.search])

  useEffect(() => {
    const timer = setTimeout(() => fetchRooms(), 300)
    return () => clearTimeout(timer)
  }, [fetchRooms])

  const handleToggleStatus = async (room) => {
    setActionLoading(true)
    try {
      const newStatus = room.status === 'inactive' ? 'active' : 'inactive'
      await updateRoomStatus(room.id, newStatus)
      setRooms(prev => prev.map(r => r.id === room.id ? { ...r, status: newStatus } : r))
    } catch (err) {
      console.error('Failed to update room status:', err)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Rooms & Properties</h1>
        </div>
        <div className="page-actions">
          <input
            className="filter-input"
            placeholder="Search by title or host..."
            value={filter.search}
            onChange={e => setFilter({ ...filter, search: e.target.value })}
          />
          <select className="filter-select" value={filter.status} onChange={e => setFilter({ ...filter, status: e.target.value })}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Room</th>
              <th>Host</th>
              <th>Location</th>
              <th>Price</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">
                    <p>Loading rooms...</p>
                  </div>
                </td>
              </tr>
            ) : rooms.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    <p>No rooms found matching your selection.</p>
                  </div>
                </td>
              </tr>
            ) : rooms.map(room => (
              <tr key={room.id}>
                <td>
                  <div className="td-main" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {room.cover_photo && (
                      <img src={room.cover_photo} alt="" style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover' }} />
                    )}
                    {room.name}
                  </div>
                </td>
                <td className="td-muted">{room.host_name}</td>
                <td className="td-muted">{room.location || '-'}</td>
                <td className="td-amount">{'\u20B1'}{Number(room.price_per_night).toLocaleString()}</td>
                <td><span className={`badge badge-${room.status}`}>{room.status}</span></td>
                <td>
                  <div className="td-actions">
                    <button
                      className={`btn btn-sm ${room.status === 'inactive' ? 'btn-brand' : 'btn-ghost'}`}
                      onClick={() => handleToggleStatus(room)}
                      disabled={actionLoading}
                    >
                      {room.status === 'inactive' ? 'Activate' : 'Deactivate'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
