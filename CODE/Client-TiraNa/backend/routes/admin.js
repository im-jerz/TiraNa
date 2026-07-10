/*
 * Admin proxy routes for Client-TiraNa.
 *
 * These mirror the endpoints the Admin-TiraNa dashboard expects from its
 * Client API client. They are intentionally public (no JWT) because the
 * internal Admin backend calls them over the isolated tirana-network.
 *
 * Data owned by the Client backend: users, bookings, payments, reviews,
 * wallets and ID verifications.
 */

import { Router } from 'express'
import pool from '../db.js'

const router = Router()

const parseId = (v) => v
const toBool = (v) => v === true || v === 'true' || v === 1 || v === '1'

// ─── Users ─────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const skip = parseInt(req.query.skip) || 0
    const limit = Math.min(parseInt(req.query.limit) || 50, 200)
    const search = (req.query.search || '').trim()

    let where = ''
    const params = []
    if (search) {
      where = `WHERE u.email ILIKE $1 OR u.username ILIKE $1 OR COALESCE(p.first_name,'') ILIKE $1 OR COALESCE(p.last_name,'') ILIKE $1`
      params.push(`%${search}%`)
    }

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM client_users u LEFT JOIN personal_information p ON p.user_id = u.id ${where}`,
      params
    )
    const total = parseInt(countRes.rows[0].count, 10)

    const dataParams = params.length ? [...params, limit, skip] : [limit, skip]
    const listRes = await pool.query(
      `SELECT u.id, u.username, u.email, u.email_verified, u.created_at,
              COALESCE(p.first_name || ' ' || p.last_name, '') AS full_name,
              COALESCE(p.id_verified, false) AS id_verified
       FROM client_users u
       LEFT JOIN personal_information p ON p.user_id = u.id
       ${where}
       ORDER BY u.created_at DESC
       LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
      dataParams
    )

    const users = listRes.rows.map((r) => ({
      id: String(r.id),
      username: r.username,
      email: r.email,
      status: 'active',
      is_verified: toBool(r.email_verified) || toBool(r.id_verified),
      created_at: r.created_at ? new Date(r.created_at).toISOString() : null,
      full_name: r.full_name || null,
    }))

    res.json({ data: { users, total } })
  } catch (err) {
    console.error('Admin users error:', err.message)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ─── Verifications (client ID verification) ────────────────
router.get('/verifications', async (req, res) => {
  try {
    const status = req.query.status || ''
    const type = req.query.type || ''

    let where = `WHERE p.id_front_url IS NOT NULL AND p.id_front_url <> ''`
    if (status === 'pending') where += ` AND COALESCE(p.id_verified, false) = false`
    else if (status === 'approved') where += ` AND COALESCE(p.id_verified, false) = true`

    const resDb = await pool.query(
      `SELECT u.id, u.email,
              COALESCE(NULLIF(btrim(COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '')), ''), u.username, u.email) AS name,
              COALESCE(p.phone_number, '') AS phone,
              COALESCE(p.id_verified, false) AS id_verified,
              p.id_front_url, p.id_back_url, p.created_at
       FROM personal_information p
       JOIN client_users u ON u.id = p.user_id
       ${where}
       ORDER BY p.created_at DESC`,
      []
    )

    const verifications = resDb.rows.map((r) => ({
      id: String(r.id),
      name: r.name || r.email,
      email: r.email,
      type: 'client',
      status: toBool(r.id_verified) ? 'approved' : 'pending',
      phone: r.phone || null,
      id_url: r.id_front_url,
      id_back_url: r.id_back_url,
      selfie_url: null,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : null,
    }))

    res.json({ data: { verifications, total: verifications.length } })
  } catch (err) {
    console.error('Admin verifications error:', err.message)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/verifications/:id/approve', async (req, res) => {
  try {
    await pool.query(
      `UPDATE personal_information SET id_verified = true WHERE user_id = $1`,
      [req.params.id]
    )
    res.json({ success: true, message: 'Verification approved.', data: { status: 'approved' } })
  } catch (err) {
    console.error('Approve verification error:', err.message)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/verifications/:id/reject', async (req, res) => {
  try {
    await pool.query(
      `UPDATE personal_information SET id_verified = false WHERE user_id = $1`,
      [req.params.id]
    )
    res.json({ success: true, message: 'Verification rejected.', data: { status: 'pending' } })
  } catch (err) {
    console.error('Reject verification error:', err.message)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ─── Bookings ──────────────────────────────────────────────
const BOOKING_SELECT = `
  SELECT b.id, b.property_id, b.user_id, b.check_in, b.check_out,
         b.adults, b.children, b.total_price, b.payment_method, b.status, b.created_at,
         u.email AS guest_email,
         COALESCE(p.first_name || ' ' || p.last_name, '') AS guest_name
  FROM bookings b
  JOIN client_users u ON u.id = b.user_id
  LEFT JOIN personal_information p ON p.user_id = u.id
`

router.get('/bookings', async (req, res) => {
  try {
    const status = req.query.status || ''
    const search = (req.query.search || '').trim()
    const skip = parseInt(req.query.skip) || 0
    const limit = Math.min(parseInt(req.query.limit) || 50, 200)

    const wheres = []
    const params = []
    if (status) { wheres.push(`b.status = $${params.length + 1}`); params.push(status) }
    if (search) {
      wheres.push(`(u.email ILIKE $${params.length + 1} OR COALESCE(p.first_name,'') ILIKE $${params.length + 1} OR COALESCE(p.last_name,'') ILIKE $${params.length + 1} OR b.property_id ILIKE $${params.length + 1})`)
      params.push(`%${search}%`)
    }
    const whereSql = wheres.length ? `WHERE ${wheres.join(' AND ')}` : ''

    const listParams = [...params, limit, skip]
    const resDb = await pool.query(
      `${BOOKING_SELECT} ${whereSql} ORDER BY b.created_at DESC LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
      listParams
    )

    const bookings = resDb.rows.map((r) => {
      const checkIn = r.check_in ? new Date(r.check_in) : null
      const checkOut = r.check_out ? new Date(r.check_out) : null
      const nights = (checkIn && checkOut)
        ? Math.max(1, Math.round((checkOut - checkIn) / (1000 * 60 * 60 * 24)))
        : null
      return {
        id: String(r.id),
        listing_title: null,
        listing_id: String(r.property_id),
        guest_name: r.guest_name || r.guest_email,
        guest_email: r.guest_email,
        check_in: checkIn ? checkIn.toISOString() : null,
        check_out: checkOut ? checkOut.toISOString() : null,
        nights,
        total_price: parseFloat(r.total_price) || 0,
        status: r.status,
        cancellation_reason: null,
      }
    })

    res.json({ data: bookings })
  } catch (err) {
    console.error('Admin bookings error:', err.message)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/bookings/count', async (req, res) => {
  try {
    const status = req.query.status || ''
    const params = []
    let whereSql = ''
    if (status) { whereSql = 'WHERE status = $1'; params.push(status) }
    const resDb = await pool.query(`SELECT COUNT(*) FROM bookings ${whereSql}`, params)
    res.json({ count: parseInt(resDb.rows[0].count, 10) })
  } catch (err) {
    console.error('Admin bookings count error:', err.message)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/bookings/trend', async (req, res) => {
  try {
    const resDb = await pool.query(
      `SELECT DATE_TRUNC('month', created_at) AS month, COUNT(*) AS count
       FROM bookings
       GROUP BY month ORDER BY month`
    )
    const data = resDb.rows.map((r) => ({
      label: new Date(r.month).toISOString().slice(0, 7),
      count: parseInt(r.count, 10),
    }))
    res.json({ data })
  } catch (err) {
    console.error('Admin booking trend error:', err.message)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ─── Payments ──────────────────────────────────────────────
router.get('/payments', async (req, res) => {
  try {
    const status = req.query.status || ''
    const search = (req.query.search || '').trim()
    const skip = parseInt(req.query.skip) || 0
    const limit = Math.min(parseInt(req.query.limit) || 50, 200)

    const wheres = []
    const params = []
    if (status) { wheres.push(`pt.status = $${params.length + 1}`); params.push(status) }
    if (search) {
      wheres.push(`(u.email ILIKE $${params.length + 1} OR pt.paymongo_payment_id ILIKE $${params.length + 1})`)
      params.push(`%${search}%`)
    }
    const whereSql = wheres.length ? `WHERE ${wheres.join(' AND ')}` : ''

    const listParams = [...params, limit, skip]
    const resDb = await pool.query(
      `SELECT pt.id, pt.amount, pt.payment_method, pt.status, pt.created_at,
              pt.booking_id, u.email AS payer_email,
              COALESCE(p.first_name || ' ' || p.last_name, '') AS payer_name
       FROM payment_transactions pt
       JOIN client_users u ON u.id = pt.user_id
       LEFT JOIN personal_information p ON p.user_id = u.id
       ${whereSql}
       ORDER BY pt.created_at DESC
       LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
      listParams
    )

    const payments = resDb.rows.map((r) => ({
      id: String(r.id),
      payer_name: r.payer_name || r.payer_email,
      payer_email: r.payer_email,
      amount: parseFloat(r.amount) || 0,
      method: r.payment_method,
      status: r.status,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : null,
      booking_external_id: r.booking_id ? String(r.booking_id) : null,
    }))

    res.json({ data: payments })
  } catch (err) {
    console.error('Admin payments error:', err.message)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/payments/count', async (req, res) => {
  try {
    const status = req.query.status || ''
    const params = []
    let whereSql = ''
    if (status) { whereSql = 'WHERE status = $1'; params.push(status) }
    const resDb = await pool.query(`SELECT COUNT(*) FROM payment_transactions ${whereSql}`, params)
    res.json({ count: parseInt(resDb.rows[0].count, 10) })
  } catch (err) {
    console.error('Admin payments count error:', err.message)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/payments/revenue', async (req, res) => {
  try {
    const resDb = await pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN status NOT IN ('refunded','failed','cancelled') THEN amount ELSE 0 END), 0) AS total_revenue,
         COALESCE(SUM(CASE WHEN status = 'refunded' THEN amount ELSE 0 END), 0) AS total_refunded
       FROM payment_transactions`
    )
    const row = resDb.rows[0]
    res.json({
      total_revenue: parseFloat(row.total_revenue) || 0,
      total_refunded: parseFloat(row.total_refunded) || 0,
    })
  } catch (err) {
    console.error('Admin revenue error:', err.message)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/revenue/trend', async (req, res) => {
  try {
    const resDb = await pool.query(
      `SELECT DATE_TRUNC('month', created_at) AS month,
              COALESCE(SUM(CASE WHEN status NOT IN ('refunded','failed','cancelled') THEN amount ELSE 0 END), 0) AS total
       FROM payment_transactions
       GROUP BY month ORDER BY month`
    )
    const data = resDb.rows.map((r) => ({
      label: new Date(r.month).toISOString().slice(0, 7),
      total: parseFloat(r.total) || 0,
    }))
    res.json({ data })
  } catch (err) {
    console.error('Admin revenue trend error:', err.message)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/payments/:id/refund', async (req, res) => {
  try {
    const { amount, reason } = req.body || {}
    const resDb = await pool.query(
      `UPDATE payment_transactions SET status = 'refunded' WHERE id = $1 RETURNING id`,
      [req.params.id]
    )
    if (resDb.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' })
    }
    res.json({ success: true, message: 'Payment refunded.', data: { id: String(resDb.rows[0].id) } })
  } catch (err) {
    console.error('Admin refund error:', err.message)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ─── Reviews (also reachable at /api/reviews/:id/hide|show) ─
router.get('/reviews', async (req, res) => {
  try {
    const resDb = await pool.query(
      `SELECT r.id, r.rating, r.review_text, r.created_at, r.is_hidden,
              COALESCE(p.first_name || ' ' || p.last_name, '') AS user_name
       FROM reviews r
       LEFT JOIN personal_information p ON p.user_id = r.user_id
       ORDER BY r.created_at DESC`
    )
    const reviews = resDb.rows.map((r) => ({
      id: String(r.id),
      user_name: r.user_name || 'Anonymous',
      rating: parseFloat(r.rating) || 0,
      comment: r.review_text || '',
      is_hidden: toBool(r.is_hidden),
      created_at: r.created_at ? new Date(r.created_at).toISOString() : null,
    }))
    res.json({ data: { reviews } })
  } catch (err) {
    console.error('Admin reviews error:', err.message)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/reviews/:id/hide', async (req, res) => {
  try {
    await pool.query(`UPDATE reviews SET is_hidden = true WHERE id = $1`, [req.params.id])
    res.json({ success: true, message: 'Review hidden.', data: { is_hidden: true } })
  } catch (err) {
    console.error('Hide review error:', err.message)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/reviews/:id/show', async (req, res) => {
  try {
    await pool.query(`UPDATE reviews SET is_hidden = false WHERE id = $1`, [req.params.id])
    res.json({ success: true, message: 'Review shown.', data: { is_hidden: false } })
  } catch (err) {
    console.error('Show review error:', err.message)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
