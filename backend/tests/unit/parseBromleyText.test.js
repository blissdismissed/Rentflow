'use strict'

const { parseBromleyText } = require('../../src/controllers/financialController')

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a minimal tab-delimited statement body.
 * Column order as produced by pdf-parse v2:
 *   DUE_DATE \t REFERENCE \t IN \t BILLING_DATE \t DOC_NUMBER AMOUNT
 */
function makeStatementText({ dateValue = '4/14/2026', total = '467.03', items = [] } = {}) {
  const headerLines = [
    'STATEMENT',
    'DATE: ' + dateValue,
    '',
  ]
  const itemLines = items.map(i => {
    const { dueDate, reference, billingDate, docNumber, amount } = i
    return `${dueDate}\t${reference}\tIN\t${billingDate}\t${docNumber} ${amount}`
  })
  const totalLine = `${total}\tTotal:`
  return [...headerLines, ...itemLines, '', totalLine].join('\n')
}

/**
 * Build a minimal cleaning invoice text.
 */
function makeCleaningInvoiceText({ reference, lineItems = [], dateValue = '1/3/2026' } = {}) {
  const header = [
    `Date: ${dateValue}`,
    `Invoice: INV001`,
    reference || 'S/C/M 1/3/26 5005700',
    '',
  ]
  const lines = lineItems.map(({ code, desc, qty, unitPrice, amount }) =>
    `${code} ${desc} ${qty} EA ${unitPrice} ${amount}`
  )
  return [...header, ...lines].join('\n')
}

/**
 * Build a minimal regular invoice text.
 */
function makeRegularInvoiceText({ period, dateValue = '1/15/2026', amounts = [] } = {}) {
  const header = [
    `Date: ${dateValue}`,
    'Invoice: INV-REG-001',
    period || '',
    '',
  ]
  const lines = amounts.map(a => `Amount due ${a}`)
  return [...header, ...lines].join('\n')
}

// ─────────────────────────────────────────────────────────────────────────────
// 3a. Statement branch
// ─────────────────────────────────────────────────────────────────────────────

describe('parseBromleyText — statement branch', () => {
  const items = [
    { dueDate: '5/16/2026', reference: 'S/C/M 4/14/26', billingDate: '4/16/2026', docNumber: 'IN0021700', amount: '194.57' },
    { dueDate: '5/16/2026', reference: 'WTR/SWR Q1',    billingDate: '4/16/2026', docNumber: 'IN0021701', amount: '155.00' },
    { dueDate: '5/16/2026', reference: 'HOA ANNUAL',    billingDate: '4/16/2026', docNumber: 'IN0021702', amount: '117.46' },
    { dueDate: '5/16/2026', reference: 'ROOF REPAIR',   billingDate: '4/16/2026', docNumber: 'IN0021703', amount: '100.00' },
  ]

  const text = makeStatementText({ dateValue: '4/14/2026', total: '467.03', items })
  let result

  beforeAll(() => {
    result = parseBromleyText(text)
  })

  test('docType is statement', () => {
    expect(result.docType).toBe('statement')
  })

  test('date is extracted from DATE: field', () => {
    expect(result.date).toBe('4/14/2026')
  })

  test('year is extracted as integer', () => {
    expect(result.year).toBe(2026)
  })

  test('total is parsed correctly from "AMOUNT\\tTotal:" format', () => {
    expect(result.total).toBeCloseTo(467.03, 2)
  })

  test('total also parsed from "Total: AMOUNT" format', () => {
    const altText = makeStatementText({ items }).replace(`467.03\tTotal:`, 'Total: 467.03')
    const r = parseBromleyText(altText)
    expect(r.total).toBeCloseTo(467.03, 2)
  })

  test('each parsed line has required fields', () => {
    expect(result.lines.length).toBeGreaterThan(0)
    for (const line of result.lines) {
      expect(line).toHaveProperty('documentNumber')
      expect(line).toHaveProperty('date')
      expect(line).toHaveProperty('reference')
      expect(line).toHaveProperty('dueDate')
      expect(line).toHaveProperty('amount')
      expect(line).toHaveProperty('tag')
    }
  })

  test('S/C/M reference → tag housekeeping', () => {
    const line = result.lines.find(l => /S\/C\/M/.test(l.reference))
    expect(line).toBeDefined()
    expect(line.tag).toBe('housekeeping')
  })

  test('WTR/SWR reference → tag utilities', () => {
    const line = result.lines.find(l => /WTR/.test(l.reference))
    expect(line).toBeDefined()
    expect(line.tag).toBe('utilities')
  })

  test('HOA reference → tag hoa', () => {
    const line = result.lines.find(l => /HOA/.test(l.reference))
    expect(line).toBeDefined()
    expect(line.tag).toBe('hoa')
  })

  test('unrecognized reference → tag maintenance', () => {
    const line = result.lines.find(l => /ROOF/.test(l.reference))
    expect(line).toBeDefined()
    expect(line.tag).toBe('maintenance')
  })

  test('lines without IN in position 2 are skipped', () => {
    const textWithSkipLine = [
      'STATEMENT',
      'DATE: 4/14/2026',
      '',
      // This line has OUT in position 2, should be skipped
      '5/16/2026\tS/C/M 4/14/26\tOUT\t4/16/2026\tIN0021700 194.57',
      // This line is valid
      '5/16/2026\tROOF REPAIR\tIN\t4/16/2026\tIN0021703 100.00',
      '100.00\tTotal:',
    ].join('\n')
    const r = parseBromleyText(textWithSkipLine)
    expect(r.lines).toHaveLength(1)
    expect(r.lines[0].reference).toBe('ROOF REPAIR')
  })

  test('space-delimited fallback: lines matching DATE_RE + space + IN are parsed', () => {
    // Space-delimited old format: DOCNUM BILLING_DATE IN REFERENCE DUEDATE AMOUNT
    const spaceText = [
      'STATEMENT',
      'DATE: 4/14/2026',
      '',
      'IN0021700 4/16/2026 IN ROOF REPAIR 5/16/2026 100.00',
      '100.00\tTotal:',
    ].join('\n')
    const r = parseBromleyText(spaceText)
    expect(r.lines).toHaveLength(1)
    expect(r.lines[0].amount).toBeCloseTo(100.00, 2)
    expect(r.lines[0].date).toBe('4/16/2026')
  })

  test('amount is correctly parsed from each line', () => {
    const amounts = result.lines.map(l => l.amount)
    expect(amounts).toContainEqual(expect.closeTo(194.57, 2))
    expect(amounts).toContainEqual(expect.closeTo(155.00, 2))
    expect(amounts).toContainEqual(expect.closeTo(117.46, 2))
    expect(amounts).toContainEqual(expect.closeTo(100.00, 2))
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 3b. Cleaning invoice branch
// ─────────────────────────────────────────────────────────────────────────────

describe('parseBromleyText — cleaning invoice branch', () => {
  test('docType is invoice and type is cleaning (S/C/M marker)', () => {
    const text = makeCleaningInvoiceText({
      reference: 'S/C/M 1/3/26 5005700',
      lineItems: [
        { code: 'BHL', desc: 'Housekeeping Labor', qty: '4.000', unitPrice: '35.00', amount: '140.00' }
      ]
    })
    const r = parseBromleyText(text)
    expect(r.docType).toBe('invoice')
    expect(r.type).toBe('cleaning')
  })

  test('docType is invoice and type is cleaning (BHL marker)', () => {
    const text = [
      'Date: 1/3/2026',
      'Invoice: INV001',
      'Some reference 1234567',
      '',
      'BHL Housekeeping Labor 4.000 EA 35.00 140.00',
    ].join('\n')
    const r = parseBromleyText(text)
    expect(r.docType).toBe('invoice')
    expect(r.type).toBe('cleaning')
  })

  test('new reference format "S/C/M 1/3/26 5005700" → cleaningDate 2026-01-03', () => {
    const text = makeCleaningInvoiceText({
      reference: 'S/C/M 1/3/26 5005700',
      lineItems: [
        { code: 'BHL', desc: 'Housekeeping Labor', qty: '4.000', unitPrice: '35.00', amount: '140.00' }
      ]
    })
    const r = parseBromleyText(text)
    expect(r.lineItems[0].cleaningDate).toBe('2026-01-03')
    expect(r.lineItems[0].cleaningMonth).toBe(1)
    expect(r.lineItems[0].cleaningYear).toBe(2026)
  })

  test('old reference format "12/29/24 S/C/M 5005700" → cleaningDate 2024-12-29', () => {
    const text = [
      'Date: 12/29/2024',
      'Invoice: INV001',
      '12/29/24 S/C/M 5005700',
      '',
      'BHL Housekeeping Labor 4.000 EA 35.00 140.00',
    ].join('\n')
    const r = parseBromleyText(text)
    expect(r.lineItems[0].cleaningDate).toBe('2024-12-29')
    expect(r.lineItems[0].cleaningMonth).toBe(12)
    expect(r.lineItems[0].cleaningYear).toBe(2024)
  })

  test('line items have required shape', () => {
    const text = makeCleaningInvoiceText({
      reference: 'S/C/M 1/3/26 5005700',
      lineItems: [
        { code: 'BHL', desc: 'Housekeeping Labor', qty: '4.000', unitPrice: '35.00', amount: '140.00' }
      ]
    })
    const r = parseBromleyText(text)
    expect(r.lineItems.length).toBe(1)
    const item = r.lineItems[0]
    expect(item).toHaveProperty('code')
    expect(item).toHaveProperty('description')
    expect(item).toHaveProperty('qty')
    expect(item).toHaveProperty('amount')
    expect(item).toHaveProperty('tag')
    expect(item).toHaveProperty('cleaningDate')
    expect(item).toHaveProperty('cleaningMonth')
    expect(item).toHaveProperty('cleaningYear')
  })

  test('items with amount <= 0 are excluded', () => {
    const text = [
      'Date: 1/3/2026',
      'Invoice: INV001',
      'S/C/M 1/3/26 5005700',
      '',
      'BHL Housekeeping Labor 4.000 EA 35.00 140.00',
      'DISC Discount 1.000 EA 0.00 0.00',
    ].join('\n')
    const r = parseBromleyText(text)
    // Only the item with amount > 0 should be included
    expect(r.lineItems.every(i => i.amount > 0)).toBe(true)
  })

  test('BHL code maps to housekeeping tag', () => {
    const text = makeCleaningInvoiceText({
      reference: 'S/C/M 1/3/26 5005700',
      lineItems: [
        { code: 'BHL', desc: 'Housekeeping Labor', qty: '4.000', unitPrice: '35.00', amount: '140.00' }
      ]
    })
    const r = parseBromleyText(text)
    expect(r.lineItems[0].tag).toBe('housekeeping')
  })

  test('multiple line items are all parsed', () => {
    const text = [
      'Date: 1/3/2026',
      'Invoice: INV001',
      'S/C/M 1/3/26 5005700',
      '',
      'BHL Housekeeping Labor 4.000 EA 35.00 140.00',
      'LIN Linen Supplies 1.000 EA 25.00 25.00',
    ].join('\n')
    const r = parseBromleyText(text)
    expect(r.lineItems).toHaveLength(2)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 3c. Regular invoice branch
// ─────────────────────────────────────────────────────────────────────────────

describe('parseBromleyText — regular invoice branch', () => {
  test('docType is invoice and type is regular', () => {
    const text = makeRegularInvoiceText({ amounts: ['250.00'] })
    const r = parseBromleyText(text)
    expect(r.docType).toBe('invoice')
    expect(r.type).toBe('regular')
  })

  test('"Service period Jan-Mar2026" → startMonth=1, endMonth=3, year=2026', () => {
    const text = makeRegularInvoiceText({
      period: 'Service period Jan-Mar2026',
      amounts: ['250.00']
    })
    const r = parseBromleyText(text)
    expect(r.startMonth).toBe(1)
    expect(r.endMonth).toBe(3)
    expect(r.year).toBe(2026)
  })

  test('single-month invoice: startMonth === endMonth === invoice date month', () => {
    const text = makeRegularInvoiceText({
      dateValue: '3/15/2026',
      amounts: ['250.00']
    })
    const r = parseBromleyText(text)
    expect(r.startMonth).toBe(3)
    expect(r.endMonth).toBe(3)
  })

  test('total parsed from "Amount due 250.00"', () => {
    const text = makeRegularInvoiceText({ amounts: ['250.00'] })
    const r = parseBromleyText(text)
    expect(r.total).toBeCloseTo(250.00, 2)
  })

  test('total is sum when multiple "Amount due" lines present', () => {
    const text = makeRegularInvoiceText({ amounts: ['100.00', '75.50', '74.50'] })
    const r = parseBromleyText(text)
    expect(r.total).toBeCloseTo(250.00, 2)
  })

  test('total from "Total amount X.XX" when no Amount due lines', () => {
    const text = [
      'Date: 3/15/2026',
      'Invoice: INV-REG-001',
      '',
      'WTR Water services 1.000 EA 100.00 100.00',
      'Total amount 100.00',
    ].join('\n')
    const r = parseBromleyText(text)
    expect(r.total).toBeCloseTo(100.00, 2)
  })

  test('line items have required shape', () => {
    const text = [
      'Date: 3/15/2026',
      'Invoice: INV-REG-001',
      '',
      'WTR Water Services 1.000 EA 75.00 75.00',
      'Amount due 75.00',
    ].join('\n')
    const r = parseBromleyText(text)
    expect(r.lineItems.length).toBeGreaterThan(0)
    const item = r.lineItems[0]
    expect(item).toHaveProperty('code')
    expect(item).toHaveProperty('description')
    expect(item).toHaveProperty('qty')
    expect(item).toHaveProperty('amount')
    expect(item).toHaveProperty('tag')
  })

  test('WTR code maps to utilities tag', () => {
    const text = [
      'Date: 3/15/2026',
      'Invoice: INV-REG-001',
      '',
      'WTR Water Services 1.000 EA 75.00 75.00',
      'Amount due 75.00',
    ].join('\n')
    const r = parseBromleyText(text)
    expect(r.lineItems[0].tag).toBe('utilities')
  })

  test('year falls back to invoice date year when no period', () => {
    const text = makeRegularInvoiceText({ dateValue: '6/1/2025', amounts: ['50.00'] })
    const r = parseBromleyText(text)
    expect(r.year).toBe(2025)
  })

  test('invoiceNumber is extracted', () => {
    const text = makeRegularInvoiceText({ amounts: ['50.00'] })
    const r = parseBromleyText(text)
    expect(r.invoiceNumber).toBe('INV-REG-001')
  })
})
