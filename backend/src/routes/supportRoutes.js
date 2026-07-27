'use strict'
const express = require('express')
const router = express.Router()
const { authenticate } = require('../middleware/auth')
const sgMail = require('@sendgrid/mail')

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'aspiretowards@gmail.com'
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@aspiretowards.com'
const FROM_NAME = process.env.SENDGRID_FROM_NAME || 'AspireTowards'

router.post('/contact', authenticate, async (req, res) => {
  try {
    const { category, subject, message } = req.body
    if (!category || !subject || !message) {
      return res.status(400).json({ success: false, message: 'category, subject, and message are required' })
    }

    const user = req.user
    const userName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email
    const categoryLabel = { bug: 'Bug Report', feature: 'Feature Request', billing: 'Billing', general: 'General Question', other: 'Other' }[category] || category

    let emailError = null
    if (process.env.SENDGRID_API_KEY) {
      try {
        sgMail.setApiKey(process.env.SENDGRID_API_KEY)
        await sgMail.send({
          to: SUPPORT_EMAIL,
          from: { email: FROM_EMAIL, name: FROM_NAME },
          replyTo: user.email,
          subject: `[${categoryLabel}] ${subject}`,
          text: `From: ${userName} <${user.email}>\nCategory: ${categoryLabel}\nSubject: ${subject}\n\n${message}`,
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
              <h2 style="color:#0f766e">[${categoryLabel}] ${subject}</h2>
              <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
                <tr><td style="padding:6px 12px;background:#f9fafb;font-weight:600;width:120px">From</td><td style="padding:6px 12px">${userName} &lt;${user.email}&gt;</td></tr>
                <tr><td style="padding:6px 12px;background:#f9fafb;font-weight:600">Category</td><td style="padding:6px 12px">${categoryLabel}</td></tr>
                <tr><td style="padding:6px 12px;background:#f9fafb;font-weight:600">User ID</td><td style="padding:6px 12px">${user.id}</td></tr>
              </table>
              <div style="background:#f9fafb;padding:16px;border-radius:8px;white-space:pre-wrap">${message.replace(/</g, '&lt;')}</div>
            </div>`
        })
        console.log(`Support email sent to ${SUPPORT_EMAIL} from ${user.email}: [${categoryLabel}] ${subject}`)
      } catch (emailErr) {
        emailError = emailErr.message
        console.error('Support email send failed:', emailErr.response?.body || emailErr.message)
      }
    } else {
      console.warn('SENDGRID_API_KEY not set — support email not sent. Message from:', user.email, '|', categoryLabel, '|', subject)
    }

    // Always return success — message was received even if email delivery failed
    res.json({ success: true, message: 'Support request received', emailError })
  } catch (err) {
    console.error('Support contact error:', err)
    res.status(500).json({ success: false, message: 'Failed to process support request: ' + err.message })
  }
})

module.exports = router
