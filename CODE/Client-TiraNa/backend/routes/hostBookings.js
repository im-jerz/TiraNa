import { Router } from 'express'
import pool from '../db.js'

const router = Router()

router.get('/property-bookings', async (req, res) => {
  try {
    const { property_ids, status } = req.query

    if (!property_ids) {
      return res.status(400).json({ error: 'property_ids query parameter is required' })
    }

    const ids = property_ids.split(',').map(id => id.trim()).filter(Boolean)
    if (ids.length === 0) {
      return res.status(400).json({ error: 'At least one property_id is required' })
    }

    let query = `
      SELECT b.id, b.user_id, b.property_id,
             b.check_in AT TIME ZONE 'Asia/Manila' as check_in,
             b.check_out AT TIME ZONE 'Asia/Manila' as check_out,
             b.adults, b.children, b.infants,
             b.total_price, b.payment_method, b.status, b.created_at,
             u.username, u.email,
             p.first_name, p.last_name, p.phone_number, p.avatar_url
      FROM bookings b
      JOIN client_users u ON u.id = b.user_id
      LEFT JOIN personal_information p ON p.user_id = u.id
      WHERE b.property_id = ANY($1)
    `
    const params = [ids]

    if (status) {
      params.push(status)
      query += ` AND b.status = $${params.length}`
    }

    query += ` ORDER BY b.created_at DESC`

    const result = await pool.query(query, params)

    const bookings = result.rows.map(row => ({
      id: row.id,
      property_id: row.property_id,
      check_in: row.check_in,
      check_out: row.check_out,
      adults: row.adults,
      children: row.children,
      infants: row.infants,
      total_price: parseFloat(row.total_price),
      payment_method: row.payment_method,
      status: row.status,
      created_at: row.created_at,
      guest: {
        id: row.user_id,
        username: row.username,
        email: row.email,
        first_name: row.first_name || '',
        last_name: row.last_name || '',
        full_name: [row.first_name, row.last_name].filter(Boolean).join(' ') || row.username,
        phone: row.phone_number || '',
        avatar_url: row.avatar_url || '',
      },
    }))

    res.json({ data: bookings })
  } catch (err) {
    console.error('Host bookings fetch error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/property-bookings/stats', async (req, res) => {
  try {
    const { property_ids } = req.query

    if (!property_ids) {
      return res.status(400).json({ error: 'property_ids query parameter is required' })
    }

    const ids = property_ids.split(',').map(id => id.trim()).filter(Boolean)
    if (ids.length === 0) {
      return res.status(400).json({ error: 'At least one property_id is required' })
    }

    const result = await pool.query(`
      SELECT
        property_id,
        COUNT(*) as total_bookings,
        COUNT(*) FILTER (WHERE status = 'pending' AND check_out > now()) as pending_count,
        COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_count,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
        COUNT(*) FILTER (WHERE status = 'cancelled' OR (status = 'pending' AND check_out <= now())) as cancelled_count,
        COUNT(*) FILTER (WHERE status = 'refund_requested') as refund_requested_count,
        COUNT(*) FILTER (WHERE status = 'refund_completed') as refund_completed_count,
        COALESCE(SUM(total_price) FILTER (WHERE status IN ('confirmed', 'completed')), 0) as total_revenue
      FROM bookings
      WHERE property_id = ANY($1)
      GROUP BY property_id
    `, [ids])

    const stats = {}
    for (const row of result.rows) {
      stats[row.property_id] = {
        total_bookings: parseInt(row.total_bookings),
        pending: parseInt(row.pending_count),
        confirmed: parseInt(row.confirmed_count),
        completed: parseInt(row.completed_count),
        cancelled: parseInt(row.cancelled_count),
        refund_requested: parseInt(row.refund_requested_count),
        refund_completed: parseInt(row.refund_completed_count),
        total_revenue: parseFloat(row.total_revenue),
      }
    }

    res.json({ data: stats })
  } catch (err) {
    console.error('Host booking stats error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params
    const { status, property_ids } = req.body

    if (!status || !['confirmed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Status must be confirmed or cancelled' })
    }

    if (!property_ids || property_ids.length === 0) {
      return res.status(400).json({ error: 'property_ids is required to verify ownership' })
    }

    const result = await pool.query(
      `UPDATE bookings SET status = $1
       WHERE id = $2 AND property_id = ANY($3) AND status = 'pending'
       RETURNING id, status`,
      [status, id, property_ids]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found or cannot be updated' })
    }

    res.json({ message: `Booking ${status} successfully`, data: result.rows[0] })
  } catch (err) {
    console.error('Update booking status error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.patch('/:id/refund-completed', async (req, res) => {
  try {
    const { id } = req.params
    const { property_ids } = req.body

    if (!property_ids || property_ids.length === 0) {
      return res.status(400).json({ error: 'property_ids is required to verify ownership' })
    }

    const result = await pool.query(
      `UPDATE bookings SET status = 'refund_completed'
       WHERE id = $1 AND property_id = ANY($2) AND status = 'refund_requested'
       RETURNING id, status`,
      [id, property_ids]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found or refund not applicable' })
    }

    res.json({ message: 'Refund completed successfully', data: result.rows[0] })
  } catch (err) {
    console.error('Complete refund error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
