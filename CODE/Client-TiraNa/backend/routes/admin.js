import { Router } from 'express'
import pool from '../db.js'
import internalApiRequired from '../middleware/internalAuth.js'

const router = Router()

router.get('/admin/users', internalApiRequired, async (req, res) => {
  try {
    const skip = parseInt(req.query.skip, 10) || 0
    const limit = parseInt(req.query.limit, 10) || 50
    const search = req.query.search || ''

    let query = `SELECT id, username, email, email_verified, created_at FROM client_users`
    let countQuery = `SELECT COUNT(*) AS total FROM client_users`
    const params = []
    const countParams = []

    if (search) {
      const whereClause = ` WHERE username ILIKE $1 OR email ILIKE $1`
      query += whereClause
      countQuery += whereClause
      params.push(`%${search}%`)
      countParams.push(`%${search}%`)
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(limit, skip)

    const result = await pool.query(query, params)
    const countResult = await pool.query(countQuery, countParams)

    const users = result.rows.map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      role: 'Client',
      status: u.email_verified ? 'active' : 'pending',
      is_verified: !!u.email_verified,
      created_at: u.created_at ? u.created_at.toISOString() : null,
    }))

    res.json({
      success: true,
      data: {
        users,
        total: parseInt(countResult.rows[0].total, 10),
      },
    })
  } catch (err) {
    console.error('Admin users error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

router.get('/admin/verifications', internalApiRequired, async (req, res) => {
  try {
    const status = req.query.status || ''
    const type = req.query.type || ''
    const skip = parseInt(req.query.skip, 10) || 0
    const limit = parseInt(req.query.limit, 10) || 50

    let query = `
      SELECT cu.id, cu.username, cu.email, pi.first_name, pi.last_name,
             pi.id_verified, pi.id_front_url, pi.id_back_url,
             pi.id_rejection_reason, pi.id_rejected_at, cu.created_at
      FROM client_users cu
      JOIN personal_information pi ON pi.user_id = cu.id
      WHERE pi.id_front_url IS NOT NULL AND pi.id_front_url != ''
    `
    let countQuery = `
      SELECT COUNT(*) AS total
      FROM client_users cu
      JOIN personal_information pi ON pi.user_id = cu.id
      WHERE pi.id_front_url IS NOT NULL AND pi.id_front_url != ''
    `
    const params = []
    const countParams = []

    if (status === 'pending') {
      const clause = ` AND pi.id_verified = false AND (pi.id_rejection_reason IS NULL OR pi.id_rejection_reason = '')`
      query += clause
      countQuery += clause
    } else if (status === 'approved') {
      const clause = ` AND pi.id_verified = true`
      query += clause
      countQuery += clause
    } else if (status === 'rejected') {
      const clause = ` AND pi.id_verified = false AND pi.id_rejection_reason IS NOT NULL AND pi.id_rejection_reason != ''`
      query += clause
      countQuery += clause
    } else {
      const clause = ` AND pi.id_verified = false AND (pi.id_rejection_reason IS NULL OR pi.id_rejection_reason = '')`
      query += clause
      countQuery += clause
    }

    query += ` ORDER BY cu.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(limit, skip)

    const result = await pool.query(query, params)
    const countResult = await pool.query(countQuery, countParams)

    const verifications = result.rows.map(u => {
      let status = 'pending'
      if (u.id_verified) {
        status = 'approved'
      } else if (u.id_rejection_reason) {
        status = 'rejected'
      }
      return {
        id: u.id,
        name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username,
        email: u.email,
        type: 'guest',
        status,
        rejection_reason: u.id_rejection_reason || null,
        id_url: u.id_front_url || null,
        id_back_url: u.id_back_url || null,
        selfie_url: null,
        created_at: u.created_at ? u.created_at.toISOString() : null,
      }
    })

    res.json({
      success: true,
      data: {
        verifications,
        total: parseInt(countResult.rows[0].total, 10),
      },
    })
  } catch (err) {
    console.error('Admin verifications error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

router.post('/admin/verifications/:id/approve', internalApiRequired, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE personal_information SET id_verified = true, id_rejection_reason = NULL, id_rejected_at = NULL, updated_at = now()
       WHERE user_id = $1 AND id_front_url IS NOT NULL AND id_front_url != ''`,
      [req.params.id]
    )
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Verification request not found' })
    }
    res.json({ success: true, message: 'Verification approved' })
  } catch (err) {
    console.error('Approve verification error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

router.post('/admin/verifications/:id/reject', internalApiRequired, async (req, res) => {
  try {
    const reason = req.body.reason || 'Rejected by admin'
    const result = await pool.query(
      `UPDATE personal_information SET id_verified = false, id_rejection_reason = $2, id_rejected_at = now(), updated_at = now()
       WHERE user_id = $1 AND id_front_url IS NOT NULL AND id_front_url != ''`,
      [req.params.id, reason]
    )
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Verification request not found' })
    }
    res.json({ success: true, message: 'Verification rejected' })
  } catch (err) {
    console.error('Reject verification error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

router.get('/admin/bookings', internalApiRequired, async (req, res) => {
  try {
    const status = req.query.status || ''
    const search = req.query.search || ''
    const skip = parseInt(req.query.skip, 10) || 0
    const limit = parseInt(req.query.limit, 10) || 50

    let query = `
      SELECT b.id, b.user_id, b.property_id, b.check_in, b.check_out,
             b.adults, b.children, b.infants,
             b.total_price, b.payment_method, b.status, b.created_at,
             u.username, u.email
      FROM bookings b
      JOIN client_users u ON u.id = b.user_id
      WHERE 1=1
    `
    const params = []

    if (status) {
      params.push(status)
      query += ` AND b.status = $${params.length}`
    }

    if (search) {
      params.push(`%${search}%`)
      query += ` AND (u.username ILIKE $${params.length} OR u.email ILIKE $${params.length} OR b.id::text ILIKE $${params.length})`
    }

    query += ` ORDER BY b.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(limit, skip)

    const result = await pool.query(query, params)

    const bookings = result.rows.map(b => ({
      id: b.id,
      listing_id: b.property_id,
      guest_name: b.username,
      guest_email: b.email,
      check_in: b.check_in ? new Date(b.check_in).toISOString() : null,
      check_out: b.check_out ? new Date(b.check_out).toISOString() : null,
      nights: null,
      total_price: parseFloat(b.total_price),
      payment_method: b.payment_method,
      status: b.status,
      cancellation_reason: null,
      created_at: b.created_at ? new Date(b.created_at).toISOString() : null,
    }))

    res.json({ data: bookings })
  } catch (err) {
    console.error('Admin bookings error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ── Payments Admin Endpoints ──

router.get('/admin/payments', internalApiRequired, async (req, res) => {
  try {
    const status = req.query.status || ''
    const search = req.query.search || ''
    const skip = parseInt(req.query.skip, 10) || 0
    const limit = parseInt(req.query.limit, 10) || 50

    let query = `
      SELECT pt.id, pt.booking_id, pt.user_id, pt.amount, pt.payment_method, pt.status, pt.created_at,
             u.username, u.email,
             b.property_id as listing_title
      FROM payment_transactions pt
      JOIN client_users u ON u.id = pt.user_id
      LEFT JOIN bookings b ON b.id = pt.booking_id
      WHERE 1=1
    `
    const params = []

    if (status) {
      params.push(status)
      query += ` AND pt.status = $${params.length}`
    }

    if (search) {
      params.push(`%${search}%`)
      query += ` AND (u.username ILIKE $${params.length} OR u.email ILIKE $${params.length} OR pt.id::text ILIKE $${params.length} OR b.property_id ILIKE $${params.length})`
    }

    query += ` ORDER BY pt.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(limit, skip)

    const result = await pool.query(query, params)

    const payments = result.rows.map(p => ({
      id: p.id,
      booking_external_id: p.booking_id,
      payer_name: p.username,
      payer_email: p.email,
      amount: parseFloat(p.amount),
      method: p.payment_method,
      status: p.status,
      created_at: p.created_at ? new Date(p.created_at).toISOString() : null,
    }))

    res.json({ data: payments })
  } catch (err) {
    console.error('Admin payments error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/admin/payments/count', internalApiRequired, async (req, res) => {
  try {
    const status = req.query.status || ''
    
    let query = `SELECT COUNT(*) AS count FROM payment_transactions WHERE 1=1`
    const params = []

    if (status) {
      params.push(status)
      query += ` AND status = $${params.length}`
    }

    const result = await pool.query(query, params)
    const count = parseInt(result.rows[0].count, 10)
    
    res.json({ count })
  } catch (err) {
    console.error('Admin payments count error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/admin/payments/revenue', internalApiRequired, async (req, res) => {
  try {
    // Get total revenue (sum of all completed or paid payments)
    const revenueResult = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) AS total_revenue 
      FROM payment_transactions 
      WHERE status IN ('completed', 'paid')
    `)
    
    // Get total refunded
    const refundedResult = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) AS total_refunded 
      FROM payment_transactions 
      WHERE status = 'refunded'
    `)
    
    res.json({
      total_revenue: parseFloat(revenueResult.rows[0].total_revenue) || 0,
      total_refunded: parseFloat(refundedResult.rows[0].total_refunded) || 0
    })
  } catch (err) {
    console.error('Admin revenue stats error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/admin/bookings/count', internalApiRequired, async (req, res) => {
  try {
    const status = req.query.status || ''
    
    let query = `SELECT COUNT(*) AS count FROM bookings WHERE 1=1`
    const params = []
    
    if (status) {
      params.push(status)
      query += ` AND status = $${params.length}`
    }
    
    const result = await pool.query(query, params)
    const count = parseInt(result.rows[0].count, 10)
    
    res.json({ count })
  } catch (err) {
    console.error('Admin bookings count error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/admin/bookings/trend', internalApiRequired, async (req, res) => {
  try {
    const period = req.query.period || 'monthly'
    
    let groupBy
    if (period === 'daily') {
      groupBy = "DATE(created_at)"
    } else if (period === 'weekly') {
      groupBy = "DATE_TRUNC('week', created_at)"
    } else {
      groupBy = "DATE_TRUNC('month', created_at)"
    }
    
    const result = await pool.query(`
      SELECT 
        ${groupBy} AS date,
        COUNT(*) AS count
      FROM bookings 
      WHERE status NOT IN ('cancelled', 'declined')
      GROUP BY ${groupBy}
      ORDER BY date
    `)
    
    const trend = result.rows.map(row => ({
      date: row.date ? new Date(row.date).toISOString().split('T')[0] : null,
      count: parseInt(row.count, 10)
    }))
    
    res.json({ data: trend })
  } catch (err) {
    console.error('Admin bookings trend error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/admin/revenue/trend', internalApiRequired, async (req, res) => {
  try {
    const period = req.query.period || 'monthly'
    
    let groupBy
    if (period === 'daily') {
      groupBy = "DATE(pt.created_at)"
    } else if (period === 'weekly') {
      groupBy = "DATE_TRUNC('week', pt.created_at)"
    } else {
      groupBy = "DATE_TRUNC('month', pt.created_at)"
    }
    
    const result = await pool.query(`
      SELECT 
        ${groupBy} AS date,
        COALESCE(SUM(pt.amount), 0) AS revenue
      FROM payment_transactions pt
      WHERE pt.status = 'completed'
      GROUP BY ${groupBy}
      ORDER BY date
    `)
    
    const trend = result.rows.map(row => ({
      date: row.date ? new Date(row.date).toISOString().split('T')[0] : null,
      revenue: parseFloat(row.revenue)
    }))
    
    res.json({ data: trend })
  } catch (err) {
    console.error('Admin revenue trend error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/admin/payments/:id/refund', internalApiRequired, async (req, res) => {
  try {
    const paymentId = req.params.id
    const { amount, reason } = req.body
    
    // Update payment status to refunded
    const result = await pool.query(
      `UPDATE payment_transactions SET status = 'refunded' WHERE id = $1`,
      [paymentId]
    )
    
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Payment not found' })
    }
    
    // TODO: In a real implementation, you would also:
    // 1. Process the refund through PayMongo or payment provider
    // 2. Update the booking status
    // 3. Create a refund record
    // 4. Update host wallet
    
    res.json({ 
      success: true, 
      message: `Refund of ₱${amount} processed successfully`,
      payment_id: paymentId,
      amount,
      reason,
      status: 'refunded'
    })
  } catch (err) {
    console.error('Admin refund payment error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
