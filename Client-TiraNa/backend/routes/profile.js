import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import pool from '../db.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname.startsWith('id_')) {
      cb(null, path.join(__dirname, '../uploads/ids'))
    } else {
      cb(null, path.join(__dirname, '../uploads/avatars'))
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname)
    cb(null, `${file.fieldname}-${req.user.id}-${uniqueSuffix}${ext}`)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }
})

function authMiddleware(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' })
  }
  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

function mapRow(row) {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    email_verified: row.email_verified,
    created_at: row.created_at,
    first_name: row.first_name || '',
    middle_name: row.middle_name || '',
    last_name: row.last_name || '',
    phone_number: row.phone_number || '',
    language: row.language || 'en',
    bio: row.bio || '',
    avatar_url: row.avatar_url || '',
    id_verified: row.id_verified || false,
    id_front_url: row.id_front_url || '',
    id_back_url: row.id_back_url || '',
  }
}

router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        u.id, u.username, u.email, u.email_verified, u.created_at,
        p.first_name, p.middle_name, p.last_name, p.phone_number, p.language, p.bio,
        p.avatar_url, p.id_verified, p.id_front_url, p.id_back_url
       FROM client_users u
       LEFT JOIN personal_information p ON p.user_id = u.id
       WHERE u.id = $1`,
      [req.user.id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }
    res.json({ user: mapRow(result.rows[0]) })
  } catch (err) {
    console.error('Get profile error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { first_name, middle_name, last_name, phone_number, language, bio } = req.body

    function capitalizeFirst(val) {
      if (!val) return val
      return val.charAt(0).toUpperCase() + val.slice(1)
    }

    const safeFirstName = capitalizeFirst(first_name)
    const safeMiddleName = capitalizeFirst(middle_name)
    const safeLastName = capitalizeFirst(last_name)

    if (safeFirstName && /\s/.test(safeFirstName)) {
      return res.status(400).json({ error: 'First name must not contain spaces' })
    }
    if (safeLastName && /\s/.test(safeLastName)) {
      return res.status(400).json({ error: 'Last name must not contain spaces' })
    }

    await pool.query(
      `INSERT INTO personal_information (user_id, first_name, middle_name, last_name, phone_number, language, bio)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id)
       DO UPDATE SET
         first_name = COALESCE($2, personal_information.first_name),
         middle_name = COALESCE($3, personal_information.middle_name),
         last_name = COALESCE($4, personal_information.last_name),
         phone_number = COALESCE($5, personal_information.phone_number),
         language = COALESCE($6, personal_information.language),
         bio = COALESCE($7, personal_information.bio),
         updated_at = now()`,
      [req.user.id, safeFirstName ?? null, safeMiddleName ?? null, safeLastName ?? null, phone_number ?? null, language ?? null, bio ?? null]
    )

    const result = await pool.query(
      `SELECT
        u.id, u.username, u.email, u.email_verified, u.created_at,
        p.first_name, p.middle_name, p.last_name, p.phone_number, p.language, p.bio,
        p.avatar_url, p.id_verified, p.id_front_url, p.id_back_url
       FROM client_users u
       LEFT JOIN personal_information p ON p.user_id = u.id
       WHERE u.id = $1`,
      [req.user.id]
    )

    res.json({ user: mapRow(result.rows[0]) })
  } catch (err) {
    console.error('Update profile error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.put('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' })
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'New passwords do not match' })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }

    const result = await pool.query(
      'SELECT password FROM client_users WHERE id = $1',
      [req.user.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    const valid = await bcrypt.compare(currentPassword, result.rows[0].password)
    if (!valid) {
      return res.status(400).json({ error: 'Current password is incorrect' })
    }

    const hashed = await bcrypt.hash(newPassword, 10)
    await pool.query('UPDATE client_users SET password = $1 WHERE id = $2', [hashed, req.user.id])

    res.json({ message: 'Password changed successfully' })
  } catch (err) {
    console.error('Change password error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/account', authMiddleware, async (req, res) => {
  try {
    const { password } = req.body

    if (!password) {
      return res.status(400).json({ error: 'Password is required to delete account' })
    }

    const result = await pool.query(
      'SELECT password FROM client_users WHERE id = $1',
      [req.user.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    const valid = await bcrypt.compare(password, result.rows[0].password)
    if (!valid) {
      return res.status(400).json({ error: 'Password is incorrect' })
    }

    await pool.query('DELETE FROM verification_codes WHERE user_id = $1', [req.user.id])
    await pool.query('DELETE FROM personal_information WHERE user_id = $1', [req.user.id])
    await pool.query('DELETE FROM client_users WHERE id = $1', [req.user.id])

    res.json({ message: 'Account deleted successfully' })
  } catch (err) {
    console.error('Delete account error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/upload-avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Avatar image is required' })
    }

    const avatar_url = `/uploads/avatars/${req.file.filename}`

    await pool.query(
      `INSERT INTO personal_information (user_id, avatar_url)
       VALUES ($1, $2)
       ON CONFLICT (user_id)
       DO UPDATE SET avatar_url = $2, updated_at = now()`,
      [req.user.id, avatar_url]
    )

    res.json({ avatar_url })
  } catch (err) {
    console.error('Upload avatar error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/verify-id', authMiddleware, upload.fields([
  { name: 'id_front', maxCount: 1 },
  { name: 'id_back', maxCount: 1 }
]), async (req, res) => {
  try {
    const frontFile = req.files?.id_front?.[0]
    const backFile = req.files?.id_back?.[0]

    if (!frontFile || !backFile) {
      return res.status(400).json({ error: 'Both ID front and back images are required' })
    }

    const id_front_url = `/uploads/ids/${frontFile.filename}`
    const id_back_url = `/uploads/ids/${backFile.filename}`

    await pool.query(
      `INSERT INTO personal_information (user_id, id_front_url, id_back_url)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id)
       DO UPDATE SET id_front_url = $2, id_back_url = $3, updated_at = now()`,
      [req.user.id, id_front_url, id_back_url]
    )

    res.json({ message: 'ID documents submitted for verification. Please wait for admin approval.' })
  } catch (err) {
    console.error('Verify ID error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
