import { Router } from 'express'
import nodemailer from 'nodemailer'
import pool from '../db.js'

const router = Router()
const HOST_API_URL = (process.env.HOST_API_URL || 'http://host-tirana-backend:5000').replace(/\/$/, '')

const smtpAuth = process.env.SMTP_USER
  ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  : undefined

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: smtpAuth,
})

router.get('/users', async (req, res) => {
  try {
    const search = req.query.search || ''
    const skip = parseInt(req.query.skip) || 0
    const limit = parseInt(req.query.limit) || 50

    let query = `
      SELECT
        u.id, u.username, u.email, u.email_verified, u.created_at,
        p.first_name, p.last_name, p.avatar_url, p.id_verified
      FROM client_users u
      LEFT JOIN personal_information p ON p.user_id = u.id
    `
    const params = []
    let paramIndex = 1

    if (search) {
      query += ` WHERE u.username ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex}`
      params.push(`%${search}%`)
      paramIndex++
    }

    const countQuery = query.replace(
      /SELECT[\s\S]*?FROM/,
      'SELECT COUNT(*) AS total FROM'
    )

    const countResult = await pool.query(countQuery, params)
    const total = parseInt(countResult.rows[0].total) || 0

    query += ` ORDER BY u.created_at DESC`
    query += ` OFFSET $${paramIndex} LIMIT $${paramIndex + 1}`
    params.push(skip, limit)

    const result = await pool.query(query, params)

    const users = result.rows.map(row => ({
      id: row.id,
      username: row.username,
      email: row.email,
      is_verified: row.email_verified || row.id_verified || false,
      created_at: row.created_at,
    }))

    res.json({ users, total })
  } catch (err) {
    console.error('Admin list users error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params

    const result = await pool.query(
      `SELECT
        u.id, u.username, u.email, u.email_verified, u.created_at,
        p.first_name, p.middle_name, p.last_name, p.phone_number,
        p.language, p.bio, p.avatar_url, p.id_verified
       FROM client_users u
       LEFT JOIN personal_information p ON p.user_id = u.id
       WHERE u.id = $1`,
      [userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({ user: result.rows[0] })
  } catch (err) {
    console.error('Admin get user error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params

    const existing = await pool.query(`SELECT id FROM client_users WHERE id = $1`, [userId])
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    await pool.query(`DELETE FROM verification_codes WHERE user_id = $1`, [userId])
    await pool.query(`DELETE FROM saved_properties WHERE user_id = $1`, [userId])
    await pool.query(`DELETE FROM personal_information WHERE user_id = $1`, [userId])
    await pool.query(`DELETE FROM client_users WHERE id = $1`, [userId])

    res.json({ message: 'User deleted successfully' })
  } catch (err) {
    console.error('Admin delete user error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/verifications', async (req, res) => {
  try {
    const status = req.query.status || ''
    const skip = parseInt(req.query.skip) || 0
    const limit = parseInt(req.query.limit) || 50

    let query = `
      SELECT
        u.id AS user_id, u.username, u.email, u.created_at,
        p.first_name, p.last_name, p.phone_number,
        p.id_verified, p.id_front_url, p.id_back_url, p.updated_at
      FROM client_users u
      INNER JOIN personal_information p ON p.user_id = u.id
    `
    const params = []
    let paramIndex = 1

    if (status === 'approved') {
      query += ` WHERE p.id_verified = true`
    } else if (status === 'pending') {
      query += ` WHERE p.id_verified = false AND p.id_front_url IS NOT NULL AND p.id_front_url != ''`
    } else if (status === 'rejected') {
      query += ` WHERE p.id_verified = false AND (p.id_front_url IS NULL OR p.id_front_url = '')`
    }

    const countResult = await pool.query(
      query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) AS total FROM'),
      params
    )
    const total = parseInt(countResult.rows[0].total) || 0

    query += ` ORDER BY p.updated_at DESC`
    query += ` OFFSET $${paramIndex} LIMIT $${paramIndex + 1}`
    params.push(skip, limit)

    const result = await pool.query(query, params)

    const verifications = result.rows.map(row => {
      let userStatus
      if (row.id_verified) {
        userStatus = 'approved'
      } else if (row.id_front_url) {
        userStatus = 'pending'
      } else {
        userStatus = 'rejected'
      }
      return {
        id: row.user_id,
        user_id: row.user_id,
        name: [row.first_name, row.last_name].filter(Boolean).join(' ') || row.username,
        email: row.email,
        type: 'client',
        status: userStatus,
        id_front_url: row.id_front_url || '',
        id_back_url: row.id_back_url || '',
        phone: row.phone_number || '',
        submitted_at: row.updated_at,
        created_at: row.created_at,
      }
    })

    res.json({ verifications, total })
  } catch (err) {
    console.error('Admin list verifications error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/verifications/:userId/approve', async (req, res) => {
  try {
    const { userId } = req.params

    const userResult = await pool.query(
      `SELECT u.username, u.email, p.first_name
       FROM client_users u
       LEFT JOIN personal_information p ON p.user_id = u.id
       WHERE u.id = $1`,
      [userId]
    )

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    await pool.query(
      `UPDATE personal_information SET id_verified = true, updated_at = now()
       WHERE user_id = $1`,
      [userId]
    )

    const user = userResult.rows[0]
    const name = user.first_name || user.username
    await sendApprovalEmail(user.email, name)

    res.json({ message: 'Verification approved.' })
  } catch (err) {
    console.error('Admin approve verification error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/verifications/:userId/reject', async (req, res) => {
  try {
    const { userId } = req.params
    const reason = req.body.reason || 'Your verification was rejected.'

    const userResult = await pool.query(
      `SELECT u.username, u.email, p.first_name
       FROM client_users u
       LEFT JOIN personal_information p ON p.user_id = u.id
       WHERE u.id = $1`,
      [userId]
    )

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    await pool.query(
      `UPDATE personal_information
       SET id_front_url = '', id_back_url = '', id_verified = false, updated_at = now()
       WHERE user_id = $1`,
      [userId]
    )

    const user = userResult.rows[0]
    const name = user.first_name || user.username
    await sendRejectionEmail(user.email, name, reason)

    res.json({ message: 'Verification rejected. ID documents cleared.' })
  } catch (err) {
    console.error('Admin reject verification error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/bookings', async (req, res) => {
  try {
    const status = req.query.status || ''
    const search = req.query.search || ''
    const skip = parseInt(req.query.skip) || 0
    const limit = parseInt(req.query.limit) || 50

    let query = `
      SELECT
        b.id, b.property_id, b.check_in, b.check_out,
        b.adults, b.children, b.infants,
        b.total_price, b.payment_method, b.status, b.created_at,
        u.id AS user_id, u.username AS guest_name, u.email AS guest_email
      FROM bookings b
      JOIN client_users u ON u.id = b.user_id
    `
    const params = []
    let paramIndex = 1

    if (status) {
      query += ` WHERE b.status = $${paramIndex}`
      params.push(status)
      paramIndex++
    }

    if (search) {
      const searchOp = search ? ` AND` : ` WHERE`
      query += `${searchOp} (u.username ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`
      params.push(`%${search}%`)
      paramIndex++
    }

    query += ` ORDER BY b.created_at DESC`
    query += ` OFFSET $${paramIndex} LIMIT $${paramIndex + 1}`
    params.push(skip, limit)

    const result = await pool.query(query, params)

    const bookings = result.rows.map(row => ({
      id: row.id,
      listing_id: row.property_id,
      guest_name: row.guest_name,
      guest_email: row.guest_email,
      check_in: row.check_in,
      check_out: row.check_out,
      nights: Math.round((new Date(row.check_out) - new Date(row.check_in)) / (86400000)),
      total_price: parseFloat(row.total_price),
      payment_method: row.payment_method,
      status: row.status,
      created_at: row.created_at,
    }))

    const propertyIds = [...new Set(bookings.map(b => b.listing_id).filter(Boolean))]
    const titleMap = {}
    await Promise.all(
      propertyIds.map(async (pid) => {
        try {
          const resp = await fetch(`${HOST_API_URL}/api/internal/property/${pid}`)
          if (resp.ok) {
            const data = await resp.json()
            titleMap[pid] = data.title
          }
        } catch {}
      })
    )
    for (const b of bookings) {
      b.listing_title = titleMap[b.listing_id] || null
    }

    res.json({ data: bookings })
  } catch (err) {
    console.error('Admin list bookings error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/bookings/count', async (req, res) => {
  try {
    const status = req.query.status || ''

    let query = `SELECT COUNT(*) AS count FROM bookings`
    const params = []

    if (status) {
      query += ` WHERE status = $1`
      params.push(status)
    }

    const result = await pool.query(query, params)
    res.json({ count: parseInt(result.rows[0].count) || 0 })
  } catch (err) {
    console.error('Admin booking count error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/bookings/trend', async (req, res) => {
  try {
    const period = req.query.period || 'monthly'

    let dateTrunc
    if (period === 'daily') {
      dateTrunc = "date_trunc('day', created_at)"
    } else if (period === 'weekly') {
      dateTrunc = "date_trunc('week', created_at)"
    } else {
      dateTrunc = "date_trunc('month', created_at)"
    }

    const result = await pool.query(`
      SELECT ${dateTrunc} AS period, COUNT(*) AS value
      FROM bookings
      GROUP BY period
      ORDER BY period ASC
      LIMIT 12
    `)

    const data = result.rows.map(row => ({
      label: new Date(row.period).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      value: parseInt(row.value),
    }))

    res.json({ data })
  } catch (err) {
    console.error('Admin booking trend error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/payments', async (req, res) => {
  try {
    const status = req.query.status || ''
    const search = req.query.search || ''
    const skip = parseInt(req.query.skip) || 0
    const limit = parseInt(req.query.limit) || 50

    let query = `
      SELECT
        pt.id, pt.booking_id, pt.user_id, pt.amount,
        pt.payment_method, pt.status, pt.created_at,
        u.username AS payer_name
      FROM payment_transactions pt
      JOIN client_users u ON u.id = pt.user_id
    `
    const params = []
    let paramIndex = 1

    if (status) {
      query += ` WHERE pt.status = $${paramIndex}`
      params.push(status)
      paramIndex++
    }

    if (search) {
      const searchOp = status ? ` AND` : ` WHERE`
      query += `${searchOp} u.username ILIKE $${paramIndex}`
      params.push(`%${search}%`)
      paramIndex++
    }

    query += ` ORDER BY pt.created_at DESC`
    query += ` OFFSET $${paramIndex} LIMIT $${paramIndex + 1}`
    params.push(skip, limit)

    const result = await pool.query(query, params)

    const payments = result.rows.map(row => ({
      id: row.id,
      payer_name: row.payer_name,
      amount: parseFloat(row.amount),
      method: row.payment_method,
      status: row.status,
      booking_id: row.booking_id,
      created_at: row.created_at,
    }))

    res.json({ data: payments })
  } catch (err) {
    console.error('Admin list payments error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/payments/count', async (req, res) => {
  try {
    const status = req.query.status || ''

    let query = `SELECT COUNT(*) AS count FROM payment_transactions`
    const params = []

    if (status) {
      query += ` WHERE status = $1`
      params.push(status)
    }

    const result = await pool.query(query, params)
    res.json({ count: parseInt(result.rows[0].count) || 0 })
  } catch (err) {
    console.error('Admin payment count error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/payments/revenue', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) AS total_revenue,
        COALESCE(SUM(CASE WHEN status = 'refunded' THEN amount ELSE 0 END), 0) AS total_refunded
      FROM payment_transactions
    `)

    res.json({
      total_revenue: parseFloat(result.rows[0].total_revenue),
      total_refunded: parseFloat(result.rows[0].total_refunded),
    })
  } catch (err) {
    console.error('Admin revenue stats error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/revenue/trend', async (req, res) => {
  try {
    const period = req.query.period || 'monthly'

    let dateTrunc
    if (period === 'daily') {
      dateTrunc = "date_trunc('day', created_at)"
    } else if (period === 'weekly') {
      dateTrunc = "date_trunc('week', created_at)"
    } else {
      dateTrunc = "date_trunc('month', created_at)"
    }

    const result = await pool.query(`
      SELECT ${dateTrunc} AS period,
             COALESCE(SUM(amount), 0) AS value
      FROM payment_transactions
      WHERE status = 'completed'
      GROUP BY period
      ORDER BY period ASC
      LIMIT 12
    `)

    const data = result.rows.map(row => ({
      label: new Date(row.period).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      value: parseFloat(row.value),
    }))

    res.json({ data })
  } catch (err) {
    console.error('Admin revenue trend error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/reviews', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 50
    const offset = (page - 1) * limit
    const search = req.query.search || ''
    const hidden = req.query.hidden || ''

    let query = `
      SELECT
        r.id, r.user_id, r.property_id, r.rating, r.review_text,
        r.created_at, r.accuracy, r.check_in, r.cleanliness,
        r.communication, r.location, r.value,
        COALESCE(p.first_name, '') AS first_name,
        COALESCE(p.last_name, '') AS last_name,
        COALESCE(p.avatar_url, '') AS avatar_url,
        COALESCE(r.is_hidden, false) AS is_hidden
      FROM reviews r
      LEFT JOIN personal_information p ON p.user_id = r.user_id
    `
    const params = []
    let paramIndex = 1
    let hasWhere = false

    if (hidden === 'true') {
      query += ` WHERE r.is_hidden = true`
      hasWhere = true
    } else if (hidden === 'false') {
      query += ` WHERE r.is_hidden = false OR r.is_hidden IS NULL`
      hasWhere = true
    }

    if (search) {
      const op = hasWhere ? ' AND' : ' WHERE'
      query += `${op} (r.review_text ILIKE $${paramIndex} OR p.first_name ILIKE $${paramIndex} OR p.last_name ILIKE $${paramIndex})`
      params.push(`%${search}%`)
      paramIndex++
    }

    const countResult = await pool.query(
      query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) AS total FROM'),
      params
    )
    const total = parseInt(countResult.rows[0].total) || 0

    query += ` ORDER BY r.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    params.push(limit, offset)

    const result = await pool.query(query, params)

    const reviews = result.rows.map(row => ({
      id: row.id,
      user_id: row.user_id,
      property_id: row.property_id,
      rating: parseFloat(row.rating),
      review_text: row.review_text,
      created_at: row.created_at,
      accuracy: row.accuracy,
      check_in: row.check_in,
      cleanliness: row.cleanliness,
      communication: row.communication,
      location: row.location,
      value: row.value,
      user_name: [row.first_name, row.last_name].filter(Boolean).join(' ') || 'Anonymous',
      avatar_url: row.avatar_url,
      is_hidden: row.is_hidden,
    }))

    res.json({ data: reviews, total, page, limit })
  } catch (err) {
    console.error('Admin list reviews error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/reviews/:id/toggle-hide', async (req, res) => {
  try {
    const { id } = req.params

    const existing = await pool.query(
      `SELECT id, is_hidden FROM reviews WHERE id = $1`,
      [id]
    )
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' })
    }

    const current = existing.rows[0].is_hidden || false
    await pool.query(
      `UPDATE reviews SET is_hidden = $1 WHERE id = $2`,
      [!current, id]
    )

    res.json({ message: `Review ${current ? 'shown' : 'hidden'} successfully.`, is_hidden: !current })
  } catch (err) {
    console.error('Admin toggle review hide error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

async function sendApprovalEmail(email, name) {
  const html = `
    <div style="max-width:480px;margin:0 auto;font-family:Helvetica,Arial,sans-serif;color:#111;">
      <div style="border-bottom:2px solid #111;padding:24px 0;text-align:center;">
        <span style="font-size:20px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">TiraNa</span>
      </div>
      <div style="padding:32px 0;">
        <h1 style="font-size:18px;font-weight:400;margin:0 0 16px;">Verification Approved</h1>
        <p style="font-size:14px;color:#555;margin:0 0 16px;">Hi ${name},</p>
        <p style="font-size:14px;color:#555;margin:0 0 16px;">Your account has been verified. You can now book properties and access all features.</p>
        <p style="font-size:14px;color:#555;margin:0;">Thank you for being part of TiraNa!</p>
      </div>
      <div style="border-top:1px solid #eee;padding:16px 0;text-align:center;font-size:11px;color:#999;">
        TiraNa &mdash; All rights reserved.
      </div>
    </div>`

  try {
    await transporter.sendMail({
      from: `"TiraNa" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'TiraNa - Verification Approved',
      html,
    })
  } catch (e) {
    console.error('Failed to send approval email:', e)
  }
}

async function sendRejectionEmail(email, name, reason) {
  const html = `
    <div style="max-width:480px;margin:0 auto;font-family:Helvetica,Arial,sans-serif;color:#111;">
      <div style="border-bottom:2px solid #111;padding:24px 0;text-align:center;">
        <span style="font-size:20px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">TiraNa</span>
      </div>
      <div style="padding:32px 0;">
        <h1 style="font-size:18px;font-weight:400;margin:0 0 16px;">Verification Rejected</h1>
        <p style="font-size:14px;color:#555;margin:0 0 16px;">Hi ${name},</p>
        <p style="font-size:14px;color:#555;margin:0 0 16px;">Unfortunately, your ID verification was not approved.</p>
        <div style="background:#fef2f2;border-radius:8px;padding:16px;margin:16px 0;border-left:4px solid #dc2626;">
          <p style="margin:0;font-size:13px;font-weight:600;color:#991b1b;">Reason:</p>
          <p style="margin:4px 0 0 0;font-size:13px;color:#991b1b;">${reason}</p>
        </div>
        <p style="font-size:14px;color:#555;margin:0 0 8px;">Your submitted ID documents have been cleared. You can upload new documents anytime.</p>
      </div>
      <div style="border-top:1px solid #eee;padding:16px 0;text-align:center;font-size:11px;color:#999;">
        TiraNa &mdash; All rights reserved.
      </div>
    </div>`

  try {
    await transporter.sendMail({
      from: `"TiraNa" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'TiraNa - Verification Rejected',
      html,
    })
  } catch (e) {
    console.error('Failed to send rejection email:', e)
  }
}

export default router
