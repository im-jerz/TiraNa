import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'
import pool from '../db.js'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

const smtpAuth = process.env.SMTP_USER
  ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  : undefined

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: smtpAuth,
})

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

async function sendVerificationEmail(email, code) {
  await transporter.sendMail({
    from: `"TiraNa" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Your verification code',
    text: `Your TiraNa verification code is: ${code}`,
    html: `
      <div style="max-width:480px;margin:0 auto;font-family:Helvetica,Arial,sans-serif;color:#111;">
        <div style="border-bottom:2px solid #111;padding:24px 0;text-align:center;">
          <span style="font-size:20px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">TiraNa</span>
        </div>
        <div style="padding:32px 0;">
          <h1 style="font-size:18px;font-weight:400;margin:0 0 16px;">Verify your email</h1>
          <p style="font-size:14px;color:#555;margin:0 0 24px;">Enter this code to complete your signup.</p>
          <div style="text-align:center;padding:24px;background:#f5f5f5;border-radius:4px;">
            <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#111;">${code}</span>
          </div>
          <p style="font-size:12px;color:#999;margin-top:24px;">This code expires in 15 minutes.</p>
        </div>
        <div style="border-top:1px solid #eee;padding:16px 0;text-align:center;font-size:11px;color:#999;">
          TiraNa &mdash; All rights reserved.
        </div>
      </div>
    `,
  })
}

async function sendPasswordResetEmail(email, code) {
  await transporter.sendMail({
    from: `"TiraNa" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Reset your password',
    text: `Your TiraNa password reset code is: ${code}`,
    html: `
      <div style="max-width:480px;margin:0 auto;font-family:Helvetica,Arial,sans-serif;color:#111;">
        <div style="border-bottom:2px solid #111;padding:24px 0;text-align:center;">
          <span style="font-size:20px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">TiraNa</span>
        </div>
        <div style="padding:32px 0;">
          <h1 style="font-size:18px;font-weight:400;margin:0 0 16px;">Reset your password</h1>
          <p style="font-size:14px;color:#555;margin:0 0 24px;">Enter this code to reset your password.</p>
          <div style="text-align:center;padding:24px;background:#f5f5f5;border-radius:4px;">
            <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#111;">${code}</span>
          </div>
          <p style="font-size:12px;color:#999;margin-top:24px;">This code expires in 15 minutes.</p>
          <p style="font-size:12px;color:#999;margin-top:8px;">If you did not request this, you can safely ignore this email.</p>
        </div>
        <div style="border-top:1px solid #eee;padding:16px 0;text-align:center;font-size:11px;color:#999;">
          TiraNa &mdash; All rights reserved.
        </div>
      </div>
    `,
  })
}

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ error: 'Email is required' })
    }

    const user = await pool.query(
      'SELECT id FROM client_users WHERE email = $1',
      [email]
    )

    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'No account found with this email' })
    }

    const lastCode = await pool.query(
      `SELECT created_at FROM verification_codes
       WHERE user_id = $1 AND type = 'password_reset'
       ORDER BY created_at DESC LIMIT 1`,
      [user.rows[0].id]
    )

    if (lastCode.rows.length > 0) {
      const elapsed = (Date.now() - new Date(lastCode.rows[0].created_at).getTime()) / 1000
      if (elapsed < 60) {
        const wait = Math.ceil(60 - elapsed)
        return res.status(429).json({ error: `Please wait ${wait}s before requesting a new code.` })
      }
    }

    const code = generateCode()

    await pool.query(
      `UPDATE verification_codes SET used = true WHERE user_id = $1 AND type = 'password_reset' AND used = false`,
      [user.rows[0].id]
    )

    await pool.query(
      `INSERT INTO verification_codes (user_id, email, code, type, expires_at)
       VALUES ($1, $2, $3, 'password_reset', now() + interval '15 minutes')`,
      [user.rows[0].id, email, code]
    )

    await pool.query(
      `DELETE FROM verification_codes
       WHERE (used = true OR expires_at < now())
         AND created_at < now() - interval '24 hours'`
    )

    await sendPasswordResetEmail(email, code)

    res.json({ message: 'A password reset code has been sent to your email.' })
  } catch (err) {
    console.error('Forgot password error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body

    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'All fields are required' })
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' })
    }

    const result = await pool.query(
      `SELECT vc.id, vc.user_id
       FROM verification_codes vc
       WHERE vc.email = $1
         AND vc.code = $2
         AND vc.type = 'password_reset'
         AND vc.used = false
         AND vc.expires_at > now()`,
      [email, code]
    )

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset code' })
    }

    const { id: codeId, user_id: userId } = result.rows[0]

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await pool.query('UPDATE verification_codes SET used = true WHERE id = $1', [codeId])
    await pool.query('UPDATE client_users SET password = $1 WHERE id = $2', [hashedPassword, userId])

    res.json({ message: 'Password has been reset successfully.' })
  } catch (err) {
    console.error('Reset password error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/signup', async (req, res) => {
  try {
    const { username, email, password, resend } = req.body

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' })
    }

    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' })
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ error: 'Username can only contain letters, numbers, and underscores' })
    }

    if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email)) {
      return res.status(400).json({ error: 'Please use a valid Gmail address (example@gmail.com)' })
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' })
    }
    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least one uppercase letter' })
    }
    if (!/[a-z]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least one lowercase letter' })
    }
    if (!/[0-9]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least one number' })
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least one symbol' })
    }

    const existingEmail = await pool.query(
      'SELECT id, email_verified FROM client_users WHERE email = $1',
      [email]
    )

    if (existingEmail.rows.length > 0) {
      const user = existingEmail.rows[0]

      if (user.email_verified) {
        return res.status(409).json({ error: 'Email already registered' })
      }

      const usernameTaken = await pool.query(
        'SELECT id FROM client_users WHERE username = $1 AND id != $2',
        [username, user.id]
      )

      if (usernameTaken.rows.length > 0) {
        return res.status(409).json({ error: 'Username already taken' })
      }

      const hashedPassword = await bcrypt.hash(password, 10)
      const code = generateCode()

      await pool.query(
        'UPDATE client_users SET username = $1, password = $2 WHERE id = $3',
        [username, hashedPassword, user.id]
      )

      await pool.query(
        `UPDATE verification_codes SET used = true WHERE user_id = $1 AND type = 'email_verification' AND used = false`,
        [user.id]
      )

      await pool.query(
        `INSERT INTO verification_codes (user_id, email, code, type, expires_at)
         VALUES ($1, $2, $3, 'email_verification', now() + interval '15 minutes')`,
        [user.id, email, code]
      )

      await sendVerificationEmail(email, code)

      return res.json({
        message: 'A new verification code has been sent to your email.',
        existing: true,
      })
    }

    const existingUsername = await pool.query(
      'SELECT id FROM client_users WHERE username = $1',
      [username]
    )

    if (existingUsername.rows.length > 0) {
      return res.status(409).json({ error: 'Username already taken' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const code = generateCode()

    const userResult = await pool.query(
      `INSERT INTO client_users (username, email, password) VALUES ($1, $2, $3) RETURNING id`,
      [username, email, hashedPassword]
    )

    const userId = userResult.rows[0].id

    await pool.query(
      `INSERT INTO verification_codes (user_id, email, code, type, expires_at)
       VALUES ($1, $2, $3, 'email_verification', now() + interval '15 minutes')`,
      [userId, email, code]
    )

    await pool.query(
      `DELETE FROM verification_codes
       WHERE (used = true OR expires_at < now())
         AND created_at < now() - interval '24 hours'`
    )

    await sendVerificationEmail(email, code)

    res.json({ message: 'Signup successful. Check your email for the verification code.' })
  } catch (err) {
    console.error('Signup error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/resend-code', async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ error: 'Email is required' })
    }

    const user = await pool.query(
      'SELECT id, email_verified FROM client_users WHERE email = $1',
      [email]
    )

    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'No account found with this email' })
    }

    if (user.rows[0].email_verified) {
      return res.status(400).json({ error: 'Email is already verified' })
    }

    const lastCode = await pool.query(
      `SELECT created_at FROM verification_codes
       WHERE user_id = $1 AND type = 'email_verification'
       ORDER BY created_at DESC LIMIT 1`,
      [user.rows[0].id]
    )

    if (lastCode.rows.length > 0) {
      const elapsed = (Date.now() - new Date(lastCode.rows[0].created_at).getTime()) / 1000
      if (elapsed < 60) {
        const wait = Math.ceil(60 - elapsed)
        return res.status(429).json({ error: `Please wait ${wait}s before requesting a new code.` })
      }
    }

    const code = generateCode()

    await pool.query(
      `UPDATE verification_codes SET used = true WHERE user_id = $1 AND type = 'email_verification' AND used = false`,
      [user.rows[0].id]
    )

    await pool.query(
      `INSERT INTO verification_codes (user_id, email, code, type, expires_at)
       VALUES ($1, $2, $3, 'email_verification', now() + interval '15 minutes')`,
      [user.rows[0].id, email, code]
    )

    await pool.query(
      `DELETE FROM verification_codes
       WHERE (used = true OR expires_at < now())
         AND created_at < now() - interval '24 hours'`
    )

    await sendVerificationEmail(email, code)

    res.json({ message: 'A new verification code has been sent.' })
  } catch (err) {
    console.error('Resend error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/cleanup-unverified', async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM client_users
       WHERE email_verified = false
         AND created_at < now() - interval '24 hours'
       RETURNING id`
    )

    const deletedIds = result.rows.map(r => r.id)

    if (deletedIds.length > 0) {
      await pool.query(
        `DELETE FROM verification_codes WHERE user_id = ANY($1)`,
        [deletedIds]
      )
    }

    res.json({ message: `Cleaned up ${deletedIds.length} unverified account(s).` })
  } catch (err) {
    console.error('Cleanup error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/signin', async (req, res) => {
  try {
    const { identifier, password } = req.body

    if (!identifier || !password) {
      return res.status(400).json({ error: 'All fields are required' })
    }

    const result = await pool.query(
      `SELECT id, username, email, password, email_verified
       FROM client_users
       WHERE email = $1 OR username = $1`,
      [identifier]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const user = result.rows[0]

    if (!user.email_verified) {
      return res.status(403).json({ error: 'Please verify your email first' })
    }

    const valid = await bcrypt.compare(password, user.password)

    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email },
    })
  } catch (err) {
    console.error('Signin error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/verify', async (req, res) => {
  try {
    const { email, code } = req.body

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required' })
    }

    const result = await pool.query(
      `SELECT vc.id, vc.user_id
       FROM verification_codes vc
       WHERE vc.email = $1
         AND vc.code = $2
         AND vc.type = 'email_verification'
         AND vc.used = false
         AND vc.expires_at > now()`,
      [email, code]
    )

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired verification code' })
    }

    const { id: codeId, user_id: userId } = result.rows[0]

    await pool.query('UPDATE verification_codes SET used = true WHERE id = $1', [codeId])
    await pool.query('UPDATE client_users SET email_verified = true WHERE id = $1', [userId])

    res.json({ message: 'Email verified successfully' })
  } catch (err) {
    console.error('Verify error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
