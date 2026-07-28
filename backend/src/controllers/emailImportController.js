const { Resend } = require('resend')
const User = require('../models/User')
const Property = require('../models/Property')
const FinancialExpenseItem = require('../models/FinancialExpenseItem')
const { parseBromleyText, smartSaveBromleyItems } = require('./financialController')

const FROM_EMAIL = process.env.EMAIL_FROM || 'booking@aspiretowards.com'

const MONTH_NAMES = ['January','February','March','April','May','June',
  'July','August','September','October','November','December']

function extractEmail(fromStr) {
  if (!fromStr) return null
  const match = fromStr.match(/<([^>]+)>/) || fromStr.match(/([^\s<>]+@[^\s<>]+)/)
  return (match?.[1] || fromStr).trim().toLowerCase()
}

function detectVendor(text) {
  if (/bromley mountain/i.test(text)) return 'bromley'
  return null
}

async function findPropertyForVendor(userId, vendor) {
  const props = await Property.findAll({ where: { userId } })
  if (vendor === 'bromley') {
    return props.find(p => /bromley/i.test(p.name) || /bromley/i.test(p.city)) || null
  }
  return null
}

async function saveBromleyData(parsed, propertyId) {
  // Cleaning invoice — smart save: replaces statement summaries for the same cleaning date
  if (parsed.type === 'cleaning') {
    const items = (parsed.lineItems || [])
      .filter(i => i.cleaningYear && i.cleaningMonth)
      .map(i => ({
        year: i.cleaningYear, month: i.cleaningMonth,
        expenseName: i.description,
        vendor: 'bromley', amount: i.amount, tag: i.tag,
        expenseDate: i.cleaningDate || null,
        qty: i.qty || null,
      }))
    const { created, replaced } = await smartSaveBromleyItems(propertyId, items)
    const dateSet = new Set((parsed.lineItems || []).map(i => i.cleaningDate).filter(Boolean))
    const replaceNote = replaced.length ? ` (filled in detail for ${replaced.length} statement summary entries)` : ''
    return {
      docType: 'invoice', count: created.length, total: parsed.total,
      detail: `${dateSet.size} cleaning(s) · ${created.length} item(s)${replaceNote} totaling $${(parsed.total || 0).toFixed(2)}`
    }
  }

  if (parsed.docType === 'statement') {
    const MABBR = {jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12}
    const items = (parsed.lines || []).map(line => {
      const parts = line.date.split('/')
      let mo = parseInt(parts[0]), y = parseInt(parts[2])
      let expenseDate = `${y}-${String(mo).padStart(2,'0')}-${String(parts[1]).padStart(2,'0')}`
      const scmDate = line.reference?.match(/S\/C\/M\s+(\d{1,2})\/(\d{1,2})\/(\d{2,4})/)
      if (scmDate) {
        let sy = parseInt(scmDate[3])
        if (sy < 100) sy += 2000
        expenseDate = `${sy}-${String(parseInt(scmDate[1])).padStart(2,'0')}-${String(parseInt(scmDate[2])).padStart(2,'0')}`
        mo = parseInt(scmDate[1]); y = sy
      } else {
        // WTR/SWR quarterly billing: split evenly across the service period months
        // e.g. "WTR/SWR OCT-DEC2025_53" → $90.82 each in October, November, December 2025
        const wtrM = line.reference?.match(/WTR\/SWR\s+([A-Z]{3})-([A-Z]{3})(\d{2,4})/i)
        if (wtrM) {
          const sm = MABBR[wtrM[1].toLowerCase()], em = MABBR[wtrM[2].toLowerCase()]
          let sy = parseInt(wtrM[3]); if (sy < 100) sy += 2000
          if (sm && em && sy) {
            const months = []; for (let m = sm; m <= em; m++) months.push(m)
            const perMonth = parseFloat((line.amount / months.length).toFixed(2))
            return months.map(m => ({
              year: sy, month: m,
              expenseName: line.reference || line.documentNumber,
              vendor: 'bromley', amount: perMonth,
              tag: line.tag || 'maintenance',
              expenseDate: `${sy}-${String(m).padStart(2,'0')}-01`,
            }))
          }
        }
      }
      return [{
        year: y, month: mo,
        expenseName: line.reference || line.documentNumber,
        vendor: 'bromley', amount: line.amount,
        tag: line.tag || 'maintenance',
        expenseDate,
      }]
    }).flat())
    const { created, skipped } = await smartSaveBromleyItems(propertyId, items)
    const skipNote = skipped.length ? ` (${skipped.length} skipped — line item detail already imported)` : ''
    return {
      docType: 'statement', count: created.length, total: parsed.total,
      detail: `${created.length} entry(s) from statement${skipNote} totaling $${(parsed.total || 0).toFixed(2)}`
    }
  }

  // Invoice — split evenly across service months
  const lineItems = parsed.lineItems || []
  let months = []
  if (parsed.startMonth && parsed.endMonth && parsed.year) {
    for (let m = parsed.startMonth; m <= parsed.endMonth; m++) months.push({ year: parsed.year, month: m })
  } else if (parsed.year && parsed.date) {
    months = [{ year: parsed.year, month: parseInt(parsed.date.split('/')[0]) }]
  }

  const divisor = months.length || 1
  const created = []
  for (const { year: y, month: mo } of months) {
    for (const item of lineItems) {
      const rec = await FinancialExpenseItem.create({
        propertyId, year: y, month: mo,
        expenseName: item.description,
        vendor: 'bromley',
        amount: parseFloat((item.amount / divisor).toFixed(2)),
        tag: item.tag,
      })
      created.push(rec)
    }
  }

  const invoiceLabel = parsed.invoiceNumbers?.length > 1
    ? `${parsed.invoiceNumbers.length} invoices (${parsed.invoiceNumbers.join(', ')})`
    : (parsed.invoiceNumber || 'unknown')
  const monthLabel = months.map(m => `${MONTH_NAMES[m.month - 1]} ${m.year}`).join(', ')

  return {
    docType: 'invoice',
    count: created.length,
    total: parsed.total,
    detail: `${lineItems.length} expense item(s) from ${invoiceLabel} → ${monthLabel}${divisor > 1 ? ` (split across ${divisor} months)` : ''}`
  }
}

async function sendResultEmail(toEmail, results) {
  if (!process.env.RESEND_API_KEY) {
    console.log('Email import result (no Resend key):', JSON.stringify(results))
    return
  }
  try {
    const r = new Resend(process.env.RESEND_API_KEY)
    const successCount = results.filter(r => !r.error).length
    const lines = results.map(r =>
      r.error
        ? `• ${r.filename}: ${r.error}`
        : `• ${r.filename} → ${r.property}: ${r.detail}${r.total ? ` ($${r.total.toFixed(2)})` : ''}`
    )
    const { error } = await r.emails.send({
      to: [toEmail],
      from: `AspireTowards <${FROM_EMAIL}>`,
      subject: `Import complete — ${successCount} of ${results.length} file(s) processed`,
      text: `Your email import results:\n\n${lines.join('\n')}\n\nView your dashboard: https://aspiretowards.com/dashboard.html`,
      html: `<p><strong>Your email import results:</strong></p><ul>${lines.map(l => `<li style="margin:4px 0">${l}</li>`).join('')}</ul><p><a href="https://aspiretowards.com/dashboard.html">View Dashboard →</a></p>`,
    })
    if (error) throw new Error(error.message)
  } catch (err) {
    console.error('Email import: confirmation send failed:', err.message)
  }
}

async function forwardVerificationEmail(body, html, subject, from) {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_FROM
  if (!adminEmail || !process.env.RESEND_API_KEY) return
  try {
    const r = new Resend(process.env.RESEND_API_KEY)
    const { error } = await r.emails.send({
      to: [adminEmail],
      from: `AspireTowards Import <${FROM_EMAIL}>`,
      subject: `[Forwarded] ${subject || 'Email verification'}`,
      text: `Original sender: ${from}\n\n${body || '(no text body)'}`,
      html: html
        ? `<p><em>Original sender: ${from}</em></p><hr>${html}`
        : undefined,
    })
    if (error) throw new Error(error.message)
    console.log(`Email import: forwarded verification email from ${from} to ${adminEmail}`)
  } catch (err) {
    console.error('Email import: failed to forward verification email:', err.message)
  }
}

const processEmailImport = async (req, res) => {
  // Respond immediately — Resend retries if it doesn't get a quick 200
  res.sendStatus(200)

  try {
    // Resend webhook events wrap the payload: { type: 'email.received', data: { from, to, ... } }
    // Fall back to req.body directly for any future format changes
    const payload = req.body.data || req.body
    console.log('Email import webhook received, type:', req.body.type, 'from:', payload.from)

    const fromEmail = extractEmail(payload.from)
    if (!fromEmail) {
      console.log('Email import: could not extract sender from payload', JSON.stringify(req.body).slice(0, 300))
      return
    }

    // Forward any verification/confirmation email (e.g. Gmail forwarding setup) to admin
    const bodyText = payload.text || ''
    const isVerification = /google\.com|mail-settings|accounts\.google|forwarding.*confirm|confirm.*forward/i.test(fromEmail + bodyText)
    if (isVerification) {
      await forwardVerificationEmail(bodyText, payload.html, payload.subject, fromEmail)
      return
    }

    const user = await User.findOne({ where: { email: fromEmail } })
    if (!user) {
      console.log(`Email import: unrecognized sender <${fromEmail}> — ignoring`)
      return
    }

    // Resend inbound sends attachments as base64 in JSON
    const attachments = payload.attachments || []
    const pdfs = attachments.filter(a =>
      a.content_type === 'application/pdf' || a.filename?.toLowerCase().endsWith('.pdf')
    )

    if (pdfs.length === 0) {
      await sendResultEmail(fromEmail, [{ filename: '(no attachment)', error: 'No PDF attachment found in your email' }])
      return
    }

    const results = []

    for (const file of pdfs) {
      try {
        const pdfParse = require('pdf-parse')
        // Resend inbound attachment content field varies — log structure once for debugging
        console.log('Email import: attachment fields:', Object.keys(file), 'content type:', file.content_type || file.type)
        const rawContent = file.content ?? file.data ?? file.body
        if (!rawContent) {
          results.push({ filename: file.filename || file.name, error: 'Attachment content missing from webhook payload' })
          continue
        }
        const buffer = Buffer.from(rawContent, 'base64')
        const d = await pdfParse(buffer)
        const text = d.text

        const vendor = detectVendor(text)
        if (!vendor) {
          results.push({ filename: file.filename, error: 'Unrecognized document — not a known Bromley or Caribbean PDF' })
          continue
        }

        const property = await findPropertyForVendor(user.id, vendor)
        if (!property) {
          results.push({ filename: file.filename, error: `No ${vendor} property found in your account` })
          continue
        }

        const parsed = parseBromleyText(text)
        const summary = await saveBromleyData(parsed, property.id)
        results.push({ filename: file.filename, property: property.name, ...summary })

        console.log(`Email import: ${file.filename} → ${property.name} (${summary.count} items, user ${user.email})`)
      } catch (fileErr) {
        console.error(`Email import: error processing ${file.filename}:`, fileErr.message)
        results.push({ filename: file.filename, error: `Processing failed: ${fileErr.message}` })
      }
    }

    await sendResultEmail(fromEmail, results)

  } catch (err) {
    console.error('processEmailImport error:', err)
  }
}

module.exports = { processEmailImport }
