import { Router } from 'express'
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'
import pool from '../db.js'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'
const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY

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

async function sendInvoiceEmail(email, data) {
  const { guestName, propertyTitle, bookingId, amount, commission, hostEarning, checkIn, checkOut } = data

  await transporter.sendMail({
    from: `"TiraNa" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `Booking Invoice - ${propertyTitle}`,
    text: `Your booking for ${propertyTitle} has been confirmed. Amount paid: ₱${formatCurrency(amount)}`,
    html: `
      <div style="max-width:520px;margin:0 auto;font-family:Helvetica,Arial,sans-serif;color:#111;">
        <div style="border-bottom:2px solid #111;padding:24px 0;text-align:center;">
          <span style="font-size:20px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">TiraNa</span>
        </div>
        <div style="padding:32px 0;">
          <h1 style="font-size:18px;font-weight:400;margin:0 0 8px;">Booking Invoice</h1>
          <p style="font-size:14px;color:#555;margin:0 0 24px;">Hi ${guestName}, thank you for your booking!</p>

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
            </table>
          </div>

          <div style="background:#f9f9f9;border-radius:8px;padding:24px;">
            <h3 style="font-size:14px;font-weight:600;margin:0 0 12px;">Payment Summary</h3>
            <table style="width:100%;font-size:13px;border-collapse:collapse;">
              <tr>
                <td style="padding:6px 0;color:#777;">Total Amount Paid</td>
                <td style="padding:6px 0;text-align:right;font-weight:700;font-size:16px;">₱${formatCurrency(amount)}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#777;">Platform Fee (13%)</td>
                <td style="padding:6px 0;text-align:right;color:#999;">₱${formatCurrency(commission)}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#777;">Host Earning</td>
                <td style="padding:6px 0;text-align:right;color:#555;">₱${formatCurrency(hostEarning)}</td>
              </tr>
            </table>
          </div>

          <p style="font-size:12px;color:#999;margin-top:24px;">This is your payment confirmation and invoice. Please keep this for your records.</p>
        </div>
        <div style="border-top:1px solid #eee;padding:16px 0;text-align:center;font-size:11px;color:#999;">
          TiraNa &mdash; All rights reserved.
        </div>
      </div>
    `,
  })
}

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

async function paymongoApi(endpoint, method = 'GET', body = null) {
  const url = `https://api.paymongo.com/v1${endpoint}`
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${Buffer.from(`${PAYMONGO_SECRET_KEY}:`).toString('base64')}`,
    },
  }
  if (body) options.body = JSON.stringify(body)
  const response = await fetch(url, options)
  const data = await response.json()
  if (!response.ok) {
    console.error('PayMongo API error:', JSON.stringify(data))
    throw new Error(data.errors?.[0]?.detail || 'PayMongo API error')
  }
  return data
}

router.post('/create-checkout', authMiddleware, async (req, res) => {
  try {
    const { booking_id, amount, property_title, host_id, check_in, check_out } = req.body

    if (!booking_id || !amount) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const booking = await pool.query(
      `SELECT id, user_id, property_id, total_price, status FROM bookings WHERE id = $1 AND user_id = $2`,
      [booking_id, req.user.id]
    )

    if (booking.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' })
    }

    const checkoutData = await paymongoApi('/checkout_sessions', 'POST', {
      data: {
        attributes: {
          send_email_receipt: false,
          show_description: true,
          show_line_items: true,
          line_items: [
            {
              name: property_title || 'Property Booking',
              quantity: 1,
              amount: Math.round(amount * 100),
              currency: 'PHP',
            }
          ],
          payment_method_types: ['gcash', 'paymaya', 'card'],
          description: `Booking for ${property_title || 'property'}`,
          metadata: {
            booking_id,
            user_id: req.user.id,
            host_id: host_id || '',
            property_title: property_title || '',
          },
          success_url: `${req.headers.origin || 'http://localhost:5173'}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${req.headers.origin || 'http://localhost:5173'}/payment/cancel`,
        },
      },
    })

    const sessionId = checkoutData.data.id
    const checkoutUrl = checkoutData.data.attributes.checkout_url

    await pool.query(
      `INSERT INTO payment_transactions (booking_id, user_id, paymongo_session_id, host_id, amount, payment_method, status)
       VALUES ($1, $2, $3, $4, $5, 'online', 'pending')`,
      [booking_id, req.user.id, sessionId, host_id || null, amount]
    )

    const commission = Number(amount) * 0.13
    const hostEarning = Number(amount) - commission

    if (host_id) {
      await pool.query(
        `INSERT INTO wallets (host_id, booking_id, amount, type, description)
         VALUES ($1, $2, $3, 'earning', 'Online payment received')`,
        [host_id, booking_id, hostEarning]
      )
    }

    const guestResult = await pool.query(
      `SELECT u.username, u.email, pi.first_name, pi.last_name
       FROM client_users u
       LEFT JOIN personal_information pi ON pi.user_id = u.id
       WHERE u.id = $1`,
      [req.user.id]
    )
    const guest = guestResult.rows[0]
    const guestName = [guest?.first_name, guest?.last_name].filter(Boolean).join(' ') || guest?.username || 'Guest'

    if (host_id) {
      const checkInDate = check_in ? new Date(check_in).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'
      const checkOutDate = check_out ? new Date(check_out).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'

      let hostUuid = null
      try {
        const hostResult = await pool.query(
          `SELECT id FROM client_users WHERE id::text = $1 LIMIT 1`,
          [host_id]
        )
        if (hostResult.rows.length > 0) {
          hostUuid = hostResult.rows[0].id
        }
      } catch {
        // host_id may not be a UUID, leave as null
      }

      await pool.query(
        `INSERT INTO notifications (sender_id, receiver_id, type, title, message)
         VALUES ($1, $2, 'payment', 'Booking Confirmed', $3)`,
        [
          hostUuid,
          req.user.id,
          `Thank you for booking "${property_title || 'a property'}"! Your payment of ₱${formatCurrency(amount)} has been received. Check-in: ${checkInDate}, Check-out: ${checkOutDate}. We look forward to hosting you!`
        ]
      )

      if (guest?.email) {
        sendInvoiceEmail(guest.email, {
          guestName,
          propertyTitle: property_title || 'Property Booking',
          bookingId: booking_id,
          amount,
          commission,
          hostEarning,
          checkIn: checkInDate,
          checkOut: checkOutDate,
        }).catch(err => console.error('Send invoice email error:', err))
      }
    }

    res.json({ checkout_url: checkoutUrl, session_id: sessionId })
  } catch (err) {
    console.error('Create checkout error:', err)
    res.status(500).json({ error: err.message || 'Internal server error' })
  }
})

router.post('/confirm', authMiddleware, async (req, res) => {
  try {
    const { session_id, booking_id, host_id } = req.body

    const payment = await pool.query(
      `SELECT id, booking_id, host_id, amount, status FROM payment_transactions
       WHERE paymongo_session_id = $1 AND user_id = $2`,
      [session_id, req.user.id]
    )

    if (payment.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' })
    }

    if (payment.rows[0].status === 'paid') {
      return res.json({ message: 'Already confirmed' })
    }

    const targetBookingId = booking_id || payment.rows[0].booking_id

    await pool.query(
      `UPDATE payment_transactions SET status = 'paid' WHERE id = $1`,
      [payment.rows[0].id]
    )

    await pool.query(
      `UPDATE bookings SET status = 'pending' WHERE id = $1 AND status = 'pending'`,
      [targetBookingId]
    )

    res.json({ message: 'Payment confirmed' })
  } catch (err) {
    console.error('Confirm payment error:', err)
    res.status(500).json({ error: 'Failed to confirm payment' })
  }
})

export default router
