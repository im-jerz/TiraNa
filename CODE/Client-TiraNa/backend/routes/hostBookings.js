import { Router } from 'express'
import nodemailer from 'nodemailer'
import pool from '../db.js'

const router = Router()

const HOST_API_URL = (process.env.HOST_API_URL || 'http://localhost:8000').replace(/\/$/, '')
const COMMISSION_RATE = 0.13

/**
 * Resolve which host owns a property, straight from the Host (Flask) backend.
 * Used to credit the correct host's wallet on booking approval — works for
 * both 'online' and 'cash' bookings since it doesn't depend on a
 * payment_transactions row existing.
 */
async function getHostIdForProperty(propertyId) {
  try {
    const resp = await fetch(`${HOST_API_URL}/api/internal/property-host/${propertyId}`)
    if (!resp.ok) return null
    const payload = await resp.json()
    return payload?.host_id ?? null
  } catch {
    return null
  }
}


const smtpAuth = process.env.SMTP_USER
  ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  : undefined

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: smtpAuth,
})

function formatCurrency(amount) {
  return Number(amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

async function sendBookingEmail(email, data) {
  const { guestName, propertyTitle, bookingId, action, checkIn, checkOut, amount } = data

  const actionText = {
    confirmed: 'Your booking has been confirmed',
    cancelled: 'Your booking has been cancelled',
    refund_completed: 'Your refund has been processed',
  }

  await transporter.sendMail({
    from: `"TiraNa" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `Booking ${action === 'confirmed' ? 'Confirmed' : action === 'cancelled' ? 'Cancelled' : 'Refund Processed'} - ${propertyTitle}`,
    text: `${actionText[action] || 'Your booking has been updated'} for ${propertyTitle}.`,
    html: `
      <div style="max-width:520px;margin:0 auto;font-family:Helvetica,Arial,sans-serif;color:#111;">
        <div style="border-bottom:2px solid #111;padding:24px 0;text-align:center;">
          <span style="font-size:20px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">TiraNa</span>
        </div>
        <div style="padding:32px 0;">
          <h1 style="font-size:18px;font-weight:400;margin:0 0 8px;">${actionText[action] || 'Booking Updated'}</h1>
          <p style="font-size:14px;color:#555;margin:0 0 24px;">Hi ${guestName}, here's an update on your booking.</p>

          <div style="background:#f9f9f9;border-radius:8px;padding:24px;margin-bottom:24px;">
            <h2 style="font-size:16px;font-weight:600;margin:0 0 16px;">${propertyTitle}</h2>
            <table style="width:100%;font-size:13px;border-collapse:collapse;">
              <tr>
                <td style="padding:6px 0;color:#777;">Booking ID</td>
                <td style="padding:6px 0;text-align:right;font-weight:500;">${bookingId}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#777;">Check-in</td>
                <td style="padding:6px 0;text-align:right;">${checkIn}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#777;">Check-out</td>
                <td style="padding:6px 0;text-align:right;">${checkOut}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#777;">Total Amount</td>
                <td style="padding:6px 0;text-align:right;font-weight:600;">₱${formatCurrency(amount)}</td>
              </tr>
            </table>
          </div>

          ${action === 'confirmed' ? `
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin-bottom:16px;">
              <p style="font-size:13px;color:#166534;margin:0;">Your host has confirmed this booking. We look forward to your stay!</p>
            </div>
          ` : ''}
          ${action === 'cancelled' ? `
            <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin-bottom:16px;">
              <p style="font-size:13px;color:#991b1b;margin:0;">This booking has been cancelled by the host. If you have any questions, please contact support.</p>
            </div>
          ` : ''}
          ${action === 'refund_completed' ? `
            <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;margin-bottom:16px;">
              <p style="font-size:13px;color:#1e40af;margin:0;">Your refund has been processed. The amount will be credited back to your original payment method.</p>
            </div>
          ` : ''}

          <p style="font-size:12px;color:#999;margin-top:24px;">If you have questions, please contact our support team.</p>
        </div>
        <div style="border-top:1px solid #eee;padding:16px 0;text-align:center;font-size:11px;color:#999;">
          TiraNa &mdash; All rights reserved.
        </div>
      </div>
    `,
  })
}

async function sendHostNotificationAndEmail(bookingId, action) {
  const bookingResult = await pool.query(
    `SELECT b.id, b.user_id, b.property_id, b.total_price, b.check_in, b.check_out,
            u.username, u.email,
            pi.first_name, pi.last_name
     FROM bookings b
     JOIN client_users u ON u.id = b.user_id
     LEFT JOIN personal_information pi ON pi.user_id = u.id
     WHERE b.id = $1`,
    [bookingId]
  )

  if (bookingResult.rows.length === 0) return

  const booking = bookingResult.rows[0]
  const guestName = [booking.first_name, booking.last_name].filter(Boolean).join(' ') || booking.username || 'Guest'
  const checkInDate = booking.check_in ? new Date(booking.check_in).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'
  const checkOutDate = booking.check_out ? new Date(booking.check_out).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'

  const titles = {
    confirmed: 'Booking Confirmed',
    cancelled: 'Booking Cancelled',
    refund_completed: 'Refund Processed',
  }

  const messages = {
    confirmed: `Great news! Your booking for "${booking.property_id}" has been confirmed by the host. Check-in: ${checkInDate}, Check-out: ${checkOutDate}. Total: ₱${formatCurrency(booking.total_price)}. We look forward to hosting you!`,
    cancelled: `Your booking for "${booking.property_id}" has been cancelled by the host. Check-in was scheduled for ${checkInDate}. If you have any concerns, please contact support.`,
    refund_completed: `Your refund for booking "${booking.property_id}" has been processed. Amount: ₱${formatCurrency(booking.total_price)}. The refund will be credited to your original payment method.`,
  }

  await pool.query(
    `INSERT INTO notifications (sender_id, receiver_id, type, title, message)
     VALUES (NULL, $1, 'booking', $2, $3)`,
    [booking.user_id, titles[action], messages[action]]
  )

  if (booking.email) {
    sendBookingEmail(booking.email, {
      guestName,
      propertyTitle: booking.property_id,
      bookingId: booking.id,
      action,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      amount: booking.total_price,
    }).catch(err => console.error('Send booking email error:', err))
  }
}

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
       RETURNING id, status, property_id, total_price`,
      [status, id, property_ids]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found or cannot be updated' })
    }

    const booking = result.rows[0]

    // This is the ONLY place money enters the host's wallet: the moment the
    // host approves the booking. Nothing is credited at checkout time, and
    // nothing shows up in the wallet's balance or transaction history before
    // this point (see GET /wallet/summary and /wallet/transactions below).
    if (status === 'confirmed') {
      const hostId = await getHostIdForProperty(booking.property_id)
      if (hostId) {
        const hostEarning = Number(booking.total_price) * (1 - COMMISSION_RATE)
        await pool.query(
          `INSERT INTO wallets (host_id, booking_id, amount, type, description)
           VALUES ($1, $2, $3, 'earning', 'Booking approved')`,
          [hostId, id, hostEarning]
        )
      } else {
        console.error(`Wallet credit skipped: could not resolve host for property ${booking.property_id}`)
      }
    }

    sendHostNotificationAndEmail(id, status).catch(err => console.error('Notification error:', err))

    res.json({ message: `Booking ${status} successfully`, data: result.rows[0] })
  } catch (err) {
    console.error('Update booking status error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// NOTE: PATCH /:id/refund-completed used to complete a refund immediately.
// That's now a two-step flow — see routes/hostRefund.js:
//   GET  /api/host/refund-receipt/:bookingId       (preview, nothing sent yet)
//   POST /api/host/refund-receipt/:bookingId/send  (actually processes it,
//                                                    via PayMongo for online
//                                                    payments)
// which is what the Bookings page's "Refund Completed" button now opens.


/**
 * GET /api/host/revenue
 *
 * Revenue data endpoint for the Host Flask backend (revenue_service.py).
 * Returns summary, monthly breakdown, per-property totals, and payout history.
 *
 * Query params:
 *   property_ids  — comma-separated property IDs (required)
 *   start         — YYYY-MM-DD (required)
 *   end           — YYYY-MM-DD (required)
 *
 * Only bookings with status IN ('confirmed', 'completed') count as revenue.
 */
router.get('/revenue', async (req, res) => {
  try {
    const { property_ids, start, end } = req.query
 
    if (!property_ids) {
      return res.status(400).json({ error: 'property_ids is required' })
    }
    if (!start || !end) {
      return res.status(400).json({ error: 'start and end date are required' })
    }
 
    const ids = property_ids.split(',').map(id => id.trim()).filter(Boolean)
    if (ids.length === 0) {
      return res.status(400).json({ error: 'At least one property_id is required' })
    }
 
    const [monthlyResult, byPropertyResult, payoutsResult, summaryResult] = await Promise.all([
      // Month-by-month grouped revenue
      pool.query(`
        SELECT
          EXTRACT(YEAR  FROM check_in)::INT AS yr,
          EXTRACT(MONTH FROM check_in)::INT AS mo,
          COALESCE(SUM(total_price), 0)     AS gross,
          COUNT(*)                           AS booking_count
        FROM bookings
        WHERE property_id = ANY($1)
          AND status IN ('confirmed', 'completed')
          AND check_in >= $2
          AND check_in <= $3
        GROUP BY yr, mo
        ORDER BY yr, mo
      `, [ids, start, end]),
 
      // Per-property totals
      pool.query(`
        SELECT
          property_id,
          COALESCE(SUM(total_price), 0) AS gross,
          COUNT(*)                       AS booking_count
        FROM bookings
        WHERE property_id = ANY($1)
          AND status IN ('confirmed', 'completed')
          AND check_in >= $2
          AND check_in <= $3
        GROUP BY property_id
      `, [ids, start, end]),
 
      // Completed bookings for payout history (full history, no date filter)
      pool.query(`
        SELECT
          id,
          total_price,
          check_out,
          property_id,
          EXTRACT(YEAR  FROM check_out)::INT AS yr,
          EXTRACT(MONTH FROM check_out)::INT AS mo
        FROM bookings
        WHERE property_id = ANY($1)
          AND status = 'completed'
        ORDER BY check_out DESC
      `, [ids]),
 
      // Overall summary for the period
      pool.query(`
        SELECT
          COALESCE(SUM(total_price), 0) AS gross,
          COUNT(*)                       AS booking_count
        FROM bookings
        WHERE property_id = ANY($1)
          AND status IN ('confirmed', 'completed')
          AND check_in >= $2
          AND check_in <= $3
      `, [ids, start, end]),
    ])
 
    res.json({
      data: {
        summary: {
          gross: parseFloat(summaryResult.rows[0].gross),
          booking_count: parseInt(summaryResult.rows[0].booking_count),
        },
        monthly: monthlyResult.rows.map(r => ({
          yr: parseInt(r.yr),
          mo: parseInt(r.mo),
          gross: parseFloat(r.gross),
          booking_count: parseInt(r.booking_count),
        })),
        by_property: byPropertyResult.rows.map(r => ({
          property_id: r.property_id,
          gross: parseFloat(r.gross),
          booking_count: parseInt(r.booking_count),
        })),
        payouts: payoutsResult.rows.map(r => ({
          id: r.id,
          total_price: parseFloat(r.total_price),
          check_out: r.check_out,
          property_id: r.property_id,
          yr: parseInt(r.yr),
          mo: parseInt(r.mo),
        })),
      }
    })
  } catch (err) {
    console.error('Revenue fetch error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * GET /api/host/wallet/summary
 *
 * Wallet balance breakdown for the Host wallet page (host_flow.md §8.1).
 * Only ever sums rows from `wallets` — and a row only exists once a
 * booking has been approved by the host (see PATCH /:id/status above) and
 * hasn't since been refunded (refund-completed DELETEs the row).
 *
 * Buckets:
 *   pending_balance   — approved, stay hasn't happened yet (check_out in the future)
 *   available_balance — approved and the stay has passed (or explicitly 'completed')
 *   on_hold_balance   — guest has requested a refund, resolution pending
 *   total_balance     — sum of all of the above
 *
 * Query params: property_ids — comma-separated (required)
 */
router.get('/wallet/summary', async (req, res) => {
  try {
    const { property_ids } = req.query

    if (!property_ids) {
      return res.status(400).json({ error: 'property_ids is required' })
    }

    const ids = property_ids.split(',').map(id => id.trim()).filter(Boolean)
    if (ids.length === 0) {
      return res.status(400).json({ error: 'At least one property_id is required' })
    }

    const result = await pool.query(`
      SELECT
        COALESCE(SUM(w.amount), 0) AS total_balance,
        COALESCE(SUM(w.amount) FILTER (
          WHERE b.status = 'confirmed' AND b.check_out > now()
        ), 0) AS pending_balance,
        COALESCE(SUM(w.amount) FILTER (
          WHERE (b.status = 'confirmed' AND b.check_out <= now()) OR b.status = 'completed'
        ), 0) AS available_balance,
        COALESCE(SUM(w.amount) FILTER (
          WHERE b.status = 'refund_requested'
        ), 0) AS on_hold_balance
      FROM wallets w
      JOIN bookings b ON b.id = w.booking_id
      WHERE b.property_id = ANY($1)
    `, [ids])

    const row = result.rows[0]

    res.json({
      data: {
        total_balance: parseFloat(row.total_balance),
        pending_balance: parseFloat(row.pending_balance),
        available_balance: parseFloat(row.available_balance),
        on_hold_balance: parseFloat(row.on_hold_balance),
      }
    })
  } catch (err) {
    console.error('Wallet summary error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * GET /api/host/wallet/transactions
 *
 * Ledger entries for the Host wallet page (host_flow.md §8.2). Same rule
 * as above: a booking only appears here once approved, and disappears
 * entirely if later refunded.
 *
 * Query params:
 *   property_ids — comma-separated (required)
 *   start, end   — YYYY-MM-DD, optional, filters on wallets.created_at
 */
router.get('/wallet/transactions', async (req, res) => {
  try {
    const { property_ids, start, end } = req.query

    if (!property_ids) {
      return res.status(400).json({ error: 'property_ids is required' })
    }

    const ids = property_ids.split(',').map(id => id.trim()).filter(Boolean)
    if (ids.length === 0) {
      return res.status(400).json({ error: 'At least one property_id is required' })
    }

    let query = `
      SELECT
        w.id, w.booking_id, w.amount, w.type, w.description, w.created_at,
        b.property_id, b.status AS booking_status, b.check_in, b.check_out, b.total_price
      FROM wallets w
      JOIN bookings b ON b.id = w.booking_id
      WHERE b.property_id = ANY($1)
    `
    const params = [ids]

    if (start) {
      params.push(start)
      query += ` AND w.created_at >= $${params.length}`
    }
    if (end) {
      params.push(end)
      query += ` AND w.created_at <= $${params.length}`
    }
    query += ` ORDER BY w.created_at DESC`

    const result = await pool.query(query, params)

    const now = new Date()
    const data = result.rows.map(r => {
      let bucket = 'available'
      if (r.booking_status === 'refund_requested') bucket = 'on_hold'
      else if (r.booking_status === 'confirmed' && new Date(r.check_out) > now) bucket = 'pending'

      return {
        id: r.id,
        booking_id: r.booking_id,
        property_id: r.property_id,
        booking_status: r.booking_status,
        bucket,
        type: r.type,
        description: r.description,
        amount: parseFloat(r.amount),
        total_price: parseFloat(r.total_price),
        check_in: r.check_in,
        check_out: r.check_out,
        created_at: r.created_at,
      }
    })

    res.json({ data })
  } catch (err) {
    console.error('Wallet transactions error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export { sendHostNotificationAndEmail }

export default router