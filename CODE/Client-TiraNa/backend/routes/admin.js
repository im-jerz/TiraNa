import { Router } from 'express'
import nodemailer from 'nodemailer'
import pool from '../db.js'

const router = Router()

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
