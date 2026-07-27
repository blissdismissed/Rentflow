const Property = require('../models/Property')
const PropertyFinancialSettings = require('../models/PropertyFinancialSettings')
const FinancialAnnualConfig = require('../models/FinancialAnnualConfig')
const FinancialMonthly = require('../models/FinancialMonthly')
const FinancialExpenseItem = require('../models/FinancialExpenseItem')
const FinancialBookingTransaction = require('../models/FinancialBookingTransaction')

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate()
}

function computeMonthMetrics(row, scheduledMortgage) {
  const grossIncome = parseFloat(row.grossIncome || 0)
  const managementFee = parseFloat(row.managementFee || 0)
  const cleaning = parseFloat(row.cleaningFee || 0)
  const utilities = parseFloat(row.utilities || 0)
  const maintenance = parseFloat(row.maintenance || 0)
  const otherExpenses = parseFloat(row.otherExpenses || 0)
  const platformCharges = parseFloat(row.platformCharges || 0)
  const grossExpenses = cleaning + utilities + maintenance + otherExpenses + platformCharges
  const netIncome = grossIncome - managementFee - grossExpenses
  const hoaPayment = parseFloat(row.hoaPayment || 0)
  const actualMortgagePaid = parseFloat(row.actualMortgagePaid || 0)
  const nightsBooked = parseInt(row.nightsBooked || 0)
  const numReservations = parseInt(row.numReservations || 0)
  const days = daysInMonth(row.year, row.month)

  return {
    grossIncome,
    managementFee,
    cleaningFee: cleaning,
    utilities,
    maintenance,
    otherExpenses,
    platformCharges,
    grossExpenses,
    netIncome,
    percentageOfIncome: grossIncome > 0 ? netIncome / grossIncome : 0,
    nightsBooked,
    numReservations,
    avgLengthOfStay: numReservations > 0 ? nightsBooked / numReservations : 0,
    occupancyRatio: nightsBooked / days,
    hoaPayment,
    actualMortgagePaid,
    extraPaid: actualMortgagePaid - (scheduledMortgage || 0),
    grossProfits: netIncome - hoaPayment - actualMortgagePaid
  }
}

function computeAnnualMetrics(months, annualConfig, purchasePrice) {
  const totals = months.reduce((acc, m) => {
    acc.grossIncome += m.grossIncome
    acc.managementFee += m.managementFee
    acc.cleaningFee += m.cleaningFee
    acc.utilities += m.utilities
    acc.maintenance += m.maintenance
    acc.otherExpenses += m.otherExpenses
    acc.platformCharges += m.platformCharges
    acc.grossExpenses += m.grossExpenses
    acc.netIncome += m.netIncome
    acc.nightsBooked += m.nightsBooked
    acc.numReservations += m.numReservations
    acc.hoaPayment += m.hoaPayment
    acc.actualMortgagePaid += m.actualMortgagePaid
    acc.extraPaid += m.extraPaid
    acc.grossProfits += m.grossProfits
    return acc
  }, {
    grossIncome: 0, managementFee: 0, cleaningFee: 0, utilities: 0,
    maintenance: 0, otherExpenses: 0, platformCharges: 0, grossExpenses: 0,
    netIncome: 0, nightsBooked: 0, numReservations: 0, hoaPayment: 0,
    actualMortgagePaid: 0, extraPaid: 0, grossProfits: 0
  })

  const ti = parseFloat(annualConfig?.taxesInsurance || 0)
  const scheduledMortgage = parseFloat(annualConfig?.scheduledMortgage || 0)
  const scheduledAnnualMortgage = scheduledMortgage * 12

  totals.taxesInsurance = ti
  totals.percentageOfIncome = totals.grossIncome > 0 ? totals.netIncome / totals.grossIncome : 0
  totals.avgLengthOfStay = totals.numReservations > 0 ? totals.nightsBooked / totals.numReservations : 0
  totals.grossProfits = totals.netIncome - totals.hoaPayment - totals.actualMortgagePaid - ti
  totals.breakEvenIdeal = totals.netIncome - totals.hoaPayment - scheduledAnnualMortgage - ti
  totals.scheduledMortgage = scheduledMortgage
  totals.notes = annualConfig?.notes || ''

  if (purchasePrice && purchasePrice > 0) {
    totals.noi = (totals.netIncome - totals.hoaPayment) / purchasePrice
    // Kev NOI: ((grossIncome * occupancyRatio) - grossExpenses - managementFee - hoaPayment) / purchasePrice
    const annualDays = months.reduce((sum, m) => sum + daysInMonth(m.year || new Date().getFullYear(), m.month), 0) || 365
    const occupancyRatio = totals.nightsBooked / annualDays
    totals.kevNoi = ((totals.grossIncome * occupancyRatio) - totals.grossExpenses - totals.managementFee - totals.hoaPayment) / purchasePrice
    totals.occupancyRatio = occupancyRatio
  } else {
    totals.noi = null
    totals.kevNoi = null
    totals.occupancyRatio = totals.nightsBooked > 0 ? totals.nightsBooked / 365 : 0
  }

  return totals
}

// GET /api/financials/properties — list owner's properties with financial settings
const getFinancialProperties = async (req, res) => {
  try {
    const properties = await Property.findAll({
      where: { userId: req.user.id },
      include: [{ model: PropertyFinancialSettings, as: 'financialSettings', required: false }],
      order: [['name', 'ASC']]
    })

    res.json({
      success: true,
      properties: properties.map(p => ({
        id: p.id,
        name: p.name,
        city: p.city,
        state: p.state,
        publiclyVisible: p.publiclyVisible,
        status: p.status,
        slug: p.slug,
        financialSettings: p.financialSettings || null
      }))
    })
  } catch (err) {
    console.error('getFinancialProperties error:', err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// GET /api/financials/:propertyId/summary — all-years summary
const getPropertySummary = async (req, res) => {
  try {
    const property = await Property.findOne({
      where: { id: req.params.propertyId, userId: req.user.id }
    })
    if (!property) return res.status(404).json({ success: false, message: 'Property not found' })

    const settings = await PropertyFinancialSettings.findOne({ where: { propertyId: property.id } })
    const purchasePrice = parseFloat(settings?.purchasePrice || 0)

    const allMonthly = await FinancialMonthly.findAll({
      where: { propertyId: property.id },
      order: [['year', 'ASC'], ['month', 'ASC']]
    })

    const allConfigs = await FinancialAnnualConfig.findAll({ where: { propertyId: property.id } })
    const configByYear = Object.fromEntries(allConfigs.map(c => [c.year, c]))

    // Group monthly records by year
    const yearMap = {}
    for (const row of allMonthly) {
      if (!yearMap[row.year]) yearMap[row.year] = []
      yearMap[row.year].push({ ...row.toJSON(), year: row.year, month: row.month })
    }

    // Years with full monthly detail
    const yearsWithDetail = Object.keys(yearMap).sort().map(year => {
      const monthMetrics = yearMap[year].map(m => computeMonthMetrics(m, configByYear[year]?.scheduledMortgage))
      const annual = computeAnnualMetrics(monthMetrics.map((m, i) => ({ ...m, month: yearMap[year][i].month, year: parseInt(year) })), configByYear[year], purchasePrice)
      return { year: parseInt(year), hasMonthlyDetail: true, ...annual }
    })

    // All years derive exclusively from monthly records
    const years = yearsWithDetail.sort((a, b) => a.year - b.year)

    // All-time totals and averages
    let allTimeTotals = null
    let allTimeAvg = null
    if (years.length > 0) {
      const keys = ['grossIncome', 'managementFee', 'grossExpenses', 'netIncome', 'nightsBooked',
        'numReservations', 'hoaPayment', 'actualMortgagePaid', 'extraPaid', 'taxesInsurance', 'grossProfits']
      allTimeTotals = keys.reduce((acc, k) => {
        acc[k] = years.reduce((sum, y) => sum + (y[k] || 0), 0)
        return acc
      }, {})
      allTimeTotals.percentageOfIncome = allTimeTotals.grossIncome > 0 ? allTimeTotals.netIncome / allTimeTotals.grossIncome : 0
      if (purchasePrice > 0) {
        allTimeTotals.noi = (allTimeTotals.netIncome - allTimeTotals.hoaPayment) / purchasePrice
      }
      allTimeAvg = Object.fromEntries(Object.entries(allTimeTotals).map(([k, v]) => [k, v / years.length]))
    }

    res.json({
      success: true,
      property: { id: property.id, name: property.name, city: property.city, state: property.state },
      purchasePrice,
      dataSource: settings?.dataSource || 'manual',
      years,
      allTimeTotals,
      allTimeAvg
    })
  } catch (err) {
    console.error('getPropertySummary error:', err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// GET /api/financials/:propertyId/year/:year — monthly detail
const getYearDetail = async (req, res) => {
  try {
    const { propertyId, year } = req.params

    const property = await Property.findOne({ where: { id: propertyId, userId: req.user.id } })
    if (!property) return res.status(404).json({ success: false, message: 'Property not found' })

    const settings = await PropertyFinancialSettings.findOne({ where: { propertyId } })
    const purchasePrice = parseFloat(settings?.purchasePrice || 0)

    const annualConfig = await FinancialAnnualConfig.findOne({ where: { propertyId, year } })

    const monthlyRows = await FinancialMonthly.findAll({
      where: { propertyId, year },
      order: [['month', 'ASC']]
    })

    const monthlyMap = Object.fromEntries(monthlyRows.map(r => [r.month, r]))

    // Build all 12 months (fill zeros for missing)
    const months = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1
      const row = monthlyMap[month] || { year: parseInt(year), month, grossIncome: 0, managementFee: 0, cleaningFee: 0, utilities: 0, maintenance: 0, otherExpenses: 0, platformCharges: 0, nightsBooked: 0, numReservations: 0, hoaPayment: 0, actualMortgagePaid: 0 }
      const metrics = computeMonthMetrics(row, annualConfig?.scheduledMortgage)
      return {
        month,
        monthName: MONTH_NAMES[i],
        id: monthlyMap[month]?.id || null,
        syncSource: monthlyMap[month]?.syncSource || 'manual',
        ...metrics
      }
    })

    const annualTotals = computeAnnualMetrics(
      months.map(m => ({ ...m, year: parseInt(year) })),
      annualConfig,
      purchasePrice
    )

    const expenseItems = await FinancialExpenseItem.findAll({
      where: { propertyId, year },
      order: [['month', 'ASC'], ['expenseDate', 'ASC']]
    })

    res.json({
      success: true,
      property: { id: property.id, name: property.name },
      year: parseInt(year),
      purchasePrice,
      dataSource: settings?.dataSource || 'manual',
      annualConfig: annualConfig || null,
      months,
      annualTotals,
      expenseItems
    })
  } catch (err) {
    console.error('getYearDetail error:', err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// POST /api/financials/:propertyId/monthly — upsert a month's data
// Maps Caribbean expense names to FinancialExpenseItem tag values
function tagForExpenseName(name) {
  const n = name.toLowerCase()
  if (/telephone|cable|internet|wifi/.test(n)) return 'utilities'
  if (/pool|grounds|housekeeping|cleaning/.test(n)) return 'housekeeping'
  if (/maintenance|labor|parts|reno|replacement/.test(n)) return 'maintenance'
  if (/recreation|hoa/.test(n)) return 'hoa'
  return 'other'
}

const upsertMonthly = async (req, res) => {
  try {
    const { propertyId } = req.params
    const property = await Property.findOne({ where: { id: propertyId, userId: req.user.id } })
    if (!property) return res.status(404).json({ success: false, message: 'Property not found' })

    const { year, month, skipIfExists, rawExpenses, ...data } = req.body
    if (!year || !month) return res.status(400).json({ success: false, message: 'year and month required' })

    const [record, created] = await FinancialMonthly.findOrCreate({
      where: { propertyId, year, month },
      defaults: { propertyId, year, month, ...data }
    })

    if (!created) {
      if (skipIfExists) return res.json({ success: true, skipped: true, record })
      await record.update(data)
    }

    // Caribbean PDF import: save individual expense line items and mark property as caribbean data source
    if (Array.isArray(rawExpenses) && rawExpenses.length > 0) {
      // Mark this property as caribbean so the year detail shows the correct single-column layout
      await PropertyFinancialSettings.findOrCreate({ where: { propertyId }, defaults: { propertyId, dataSource: 'caribbean' } })
        .then(([s, created]) => { if (!created && s.dataSource !== 'caribbean') return s.update({ dataSource: 'caribbean' }) })

      // Replace auto-imported expense items for this month
      await FinancialExpenseItem.destroy({ where: { propertyId, year, month, vendor: 'caribbean-pdf' } })
      for (const exp of rawExpenses) {
        if (exp.name === 'Management Commission') continue // already in managementFee field
        await FinancialExpenseItem.create({
          propertyId, year, month,
          expenseName: exp.name,
          amount: parseFloat(Math.abs(exp.amount).toFixed(2)),
          tag: tagForExpenseName(exp.name),
          vendor: 'caribbean-pdf',
        })
      }
    }

    res.json({ success: true, skipped: false, record })
  } catch (err) {
    console.error('upsertMonthly error:', err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// POST /api/financials/:propertyId/annual-config — upsert annual config
const upsertAnnualConfig = async (req, res) => {
  try {
    const { propertyId } = req.params
    const property = await Property.findOne({ where: { id: propertyId, userId: req.user.id } })
    if (!property) return res.status(404).json({ success: false, message: 'Property not found' })

    const { year, scheduledMortgage, taxesInsurance, notes } = req.body
    if (!year) return res.status(400).json({ success: false, message: 'year required' })

    const [config, created] = await FinancialAnnualConfig.findOrCreate({
      where: { propertyId, year },
      defaults: { propertyId, year, scheduledMortgage, taxesInsurance, notes }
    })
    if (!created) await config.update({ scheduledMortgage, taxesInsurance, notes })

    res.json({ success: true, config })
  } catch (err) {
    console.error('upsertAnnualConfig error:', err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// POST /api/financials/:propertyId/settings — upsert financial settings
const upsertFinancialSettings = async (req, res) => {
  try {
    const { propertyId } = req.params
    const property = await Property.findOne({ where: { id: propertyId, userId: req.user.id } })
    if (!property) return res.status(404).json({ success: false, message: 'Property not found' })

    const { purchasePrice, dataSource } = req.body
    const updates = {}
    if (purchasePrice !== undefined) updates.purchasePrice = purchasePrice
    if (dataSource !== undefined) updates.dataSource = dataSource
    const [settings, created] = await PropertyFinancialSettings.findOrCreate({
      where: { propertyId },
      defaults: { propertyId, ...updates }
    })
    if (!created && Object.keys(updates).length > 0) await settings.update(updates)

    res.json({ success: true, settings })
  } catch (err) {
    console.error('upsertFinancialSettings error:', err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// POST /api/financials/:propertyId/expenses — add expense item
const addExpenseItem = async (req, res) => {
  try {
    const { propertyId } = req.params
    const property = await Property.findOne({ where: { id: propertyId, userId: req.user.id } })
    if (!property) return res.status(404).json({ success: false, message: 'Property not found' })

    const item = await FinancialExpenseItem.create({ propertyId, ...req.body })
    res.status(201).json({ success: true, item })
  } catch (err) {
    console.error('addExpenseItem error:', err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// PUT /api/financials/expenses/:id — update expense item
const updateExpenseItem = async (req, res) => {
  try {
    const item = await FinancialExpenseItem.findByPk(req.params.id)
    if (!item) return res.status(404).json({ success: false, message: 'Not found' })

    const property = await Property.findOne({ where: { id: item.propertyId, userId: req.user.id } })
    if (!property) return res.status(403).json({ success: false, message: 'Forbidden' })

    await item.update(req.body)
    res.json({ success: true, item })
  } catch (err) {
    console.error('updateExpenseItem error:', err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// DELETE /api/financials/expenses/:id — delete expense item
const deleteExpenseItem = async (req, res) => {
  try {
    const item = await FinancialExpenseItem.findByPk(req.params.id)
    if (!item) return res.status(404).json({ success: false, message: 'Not found' })

    const property = await Property.findOne({ where: { id: item.propertyId, userId: req.user.id } })
    if (!property) return res.status(403).json({ success: false, message: 'Forbidden' })

    await item.destroy()
    res.json({ success: true })
  } catch (err) {
    console.error('deleteExpenseItem error:', err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// DELETE /api/financials/:propertyId/monthly/:monthlyId — delete one month's record
const deleteMonthly = async (req, res) => {
  try {
    const { propertyId, monthlyId } = req.params
    const property = await Property.findOne({ where: { id: propertyId, userId: req.user.id } })
    if (!property) return res.status(404).json({ success: false, message: 'Property not found' })

    const record = await FinancialMonthly.findOne({ where: { id: monthlyId, propertyId } })
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' })

    await record.destroy()
    res.json({ success: true })
  } catch (err) {
    console.error('deleteMonthly error:', err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// DELETE /api/financials/:propertyId/year/:year — delete all monthly records + clear annual summary for a year
const deleteYear = async (req, res) => {
  try {
    const { propertyId, year } = req.params
    const property = await Property.findOne({ where: { id: propertyId, userId: req.user.id } })
    if (!property) return res.status(404).json({ success: false, message: 'Property not found' })

    // Delete all monthly records for the year
    const monthlyDeleted = await FinancialMonthly.destroy({ where: { propertyId, year } })

    // Clear annual summary fields from annual_config (preserve mortgage/T&I)
    const config = await FinancialAnnualConfig.findOne({ where: { propertyId, year } })
    if (config) {
      await config.update({
        grossIncomeAnnual: null, managementFeeAnnual: null, platformChargesAnnual: null,
        cleaningFeeAnnual: null, utilitiesAnnual: null, maintenanceAnnual: null,
        otherExpensesAnnual: null, nightsBookedAnnual: null, numReservationsAnnual: null,
        hoaAnnual: null, actualMortgageAnnual: null,
      })
    }

    // Also delete expense items for the year
    await FinancialExpenseItem.destroy({ where: { propertyId, year } })

    res.json({ success: true, monthlyDeleted })
  } catch (err) {
    console.error('deleteYear error:', err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// DELETE /api/financials/:propertyId/monthly-batch — undo a batch of monthly upserts
const deleteMonthlyBatch = async (req, res) => {
  try {
    const { propertyId } = req.params
    const { monthlyIds } = req.body
    if (!Array.isArray(monthlyIds) || !monthlyIds.length) {
      return res.status(400).json({ success: false, message: 'monthlyIds array required' })
    }
    const property = await Property.findOne({ where: { id: propertyId, userId: req.user.id } })
    if (!property) return res.status(404).json({ success: false, message: 'Property not found' })

    const records = await FinancialMonthly.findAll({ where: { id: monthlyIds, propertyId } })
    for (const rec of records) {
      await FinancialExpenseItem.destroy({ where: { propertyId, year: rec.year, month: rec.month } })
    }
    const deleted = await FinancialMonthly.destroy({ where: { id: monthlyIds, propertyId } })
    res.json({ success: true, deleted })
  } catch (err) {
    console.error('deleteMonthlyBatch error:', err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// DELETE /api/financials/:propertyId/booking-transactions-undo — undo an Evolve CSV import
// Deletes the specified transactions and recomputes affected months from what remains
const undoBookingTransactions = async (req, res) => {
  try {
    const { propertyId } = req.params
    const { transactionIds } = req.body
    if (!Array.isArray(transactionIds) || !transactionIds.length) {
      return res.status(400).json({ success: false, message: 'transactionIds array required' })
    }
    const property = await Property.findOne({ where: { id: propertyId, userId: req.user.id } })
    if (!property) return res.status(404).json({ success: false, message: 'Property not found' })

    const records = await FinancialBookingTransaction.findAll({ where: { id: transactionIds, propertyId } })
    const affectedMonths = new Set(records.map(r => `${r.year}-${r.month}`))

    await FinancialBookingTransaction.destroy({ where: { id: transactionIds, propertyId } })

    for (const key of affectedMonths) {
      const [yearStr, monthStr] = key.split('-')
      const year = parseInt(yearStr), month = parseInt(monthStr)
      const remaining = await FinancialBookingTransaction.findAll({ where: { propertyId, year, month } })
      if (remaining.length === 0) {
        await FinancialMonthly.destroy({ where: { propertyId, year, month, syncSource: 'evolve' } })
      } else {
        const grossIncome = remaining.reduce((s, t) => s + parseFloat(t.grossAmount || 0), 0)
        const nightsBooked = remaining.reduce((s, t) => s + parseInt(t.nightsBooked || 0), 0)
        await FinancialMonthly.update(
          { grossIncome, nightsBooked, numReservations: remaining.length },
          { where: { propertyId, year, month } }
        )
      }
    }

    res.json({ success: true, deleted: records.length, monthsRecomputed: affectedMonths.size })
  } catch (err) {
    console.error('undoBookingTransactions error:', err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// POST /api/financials/parse-caribbean-statement — parse a Caribbean Resorts PDF statement
const parseCaribbeaStatement = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' })

    const { PDFParse } = require('pdf-parse')
    const parser = new PDFParse({ data: req.file.buffer })
    const data = await parser.getText()
    await parser.destroy()
    const text = data.text

    // Date range → month + year
    const dateMatch = text.match(/From Date:\s*(\d{2})\/(\d{2})\/(\d{4})/)
    if (!dateMatch) return res.status(400).json({ success: false, message: 'Could not find date range in statement' })
    const month = parseInt(dateMatch[1])
    const year  = parseInt(dateMatch[3])

    // Gross income
    const grossMatch = text.match(/Total Room Revenue:\s*\$([0-9,]+\.?\d*)/)
    const grossIncome = grossMatch ? parseFloat(grossMatch[1].replace(/,/g, '')) : 0

    // Guest nights (MTD = first number)
    const nightsMatch = text.match(/Guest Nights Sold\s+(\d+)/)
    const nightsBooked = nightsMatch ? parseInt(nightsMatch[1]) : 0

    // Count reservation rows by date-range pattern
    const reservationRows = (text.match(/\d{2}\/\d{2}\/\d{4}\s+\d{2}\/\d{2}\/\d{4}/g) || [])
    const numReservations = reservationRows.length

    // Known expense line names on Caribbean statements
    const KNOWN_EXPENSES = [
      'Management Commission',
      'Credit Card',
      'Monthly Telephone Charge',
      'Replacement Fee',
      'Annual General Maintenance',
      'Annual Recreation Fee',
      'Reno Project Credit',
      'Labor Cost',
      'Parts Cost',
      'Housekeeping',
      'Pool/Grounds',
      'Cable TV',
      'Internet',
    ]

    const rawExpenses = []
    let managementFee = 0
    let knownOtherExpenses = 0

    for (const name of KNOWN_EXPENSES) {
      const esc = name.replace(/[()[\].*+?^${}|]/g, '\\$&')
      const posM = text.match(new RegExp(`${esc}\\s+\\$([0-9,]+\\.\\d{2})`))
      const negM = text.match(new RegExp(`${esc}\\s+\\(\\$([0-9,]+\\.\\d{2})\\)`))
      if (!posM && !negM) continue
      const amount = posM
        ? parseFloat(posM[1].replace(/,/g, ''))
        : -parseFloat(negM[1].replace(/,/g, ''))
      rawExpenses.push({ name, amount })
      if (name === 'Management Commission') managementFee = amount
      else knownOtherExpenses += amount
    }

    // Net due to owner — handle both positive ($X) and negative (($X)) formats
    let netDue = null
    const netMatchPos = text.match(/Net Due to \(from\) Owner\s+\$([0-9,]+\.?\d*)/)
    const netMatchNeg = text.match(/Net Due to \(from\) Owner\s+\(\$([0-9,]+\.?\d*)\)/)
    if (netMatchPos) netDue = parseFloat(netMatchPos[1].replace(/,/g, ''))
    else if (netMatchNeg) netDue = -parseFloat(netMatchNeg[1].replace(/,/g, ''))

    // Use netDue as ground truth: otherExpenses = grossIncome - managementFee - netDue
    // This is the most reliable calculation — avoids ambiguity in how the PDF totals expenses.
    // Fall back to summing known line items if netDue not found.
    const otherExpenses = netDue != null
      ? parseFloat((grossIncome - managementFee - netDue).toFixed(2))
      : parseFloat(knownOtherExpenses.toFixed(2))

    res.json({
      success: true,
      parsed: { month, year, grossIncome, managementFee, otherExpenses, nightsBooked, numReservations, rawExpenses, netDue }
    })
  } catch (err) {
    console.error('parseCaribbeaStatement error:', err)
    res.status(500).json({ success: false, message: 'Failed to parse PDF: ' + err.message })
  }
}

// POST /api/financials/parse-bromley-pdf — parse a Bromley Mountain invoice or statement PDF
const MONTH_ABBR = { jan:1, feb:2, mar:3, apr:4, may:5, jun:6, jul:7, aug:8, sep:9, oct:10, nov:11, dec:12 }

function tagBromleyItem(code, desc) {
  const s = (code + ' ' + desc).toLowerCase()
  if (/wtr|water|swr|sewer|electric|util/.test(s)) return 'utilities'
  if (/hoa|assoc|condomin/.test(s)) return 'hoa'
  if (/housekeep|bhl|linen|bed|towel|bathmat|pillowcase|facecloth|barsoap|toilet|tissue|paper|clean/.test(s)) return 'housekeeping'
  return 'maintenance'
}

function tagBromleyStatement(reference) {
  const s = reference.toLowerCase()
  if (/water|sewer|electric|util/.test(s)) return 'utilities'
  if (/hoa|assoc/.test(s)) return 'hoa'
  if (/s\/c\/m|clean|housekeep/.test(s)) return 'housekeeping'
  return 'maintenance'
}

const parseBromleyPdf = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' })

    const { PDFParse } = require('pdf-parse')
    const parser = new PDFParse({ data: req.file.buffer })
    const d = await parser.getText()
    await parser.destroy()
    const text = d.text

    // Detect type: statements have "STATEMENT" prominently, invoices have "Invoice"
    const isStatement = /^\s*STATEMENT/m.test(text)

    if (isStatement) {
      // ── Statement parser ──────────────────────────────────────────
      const dateMatch = text.match(/DATE:\s*(\d{1,2}\/\d{1,2}\/(\d{4}))/)
      const date = dateMatch ? dateMatch[1] : null
      const year = dateMatch ? parseInt(dateMatch[2]) : null

      const totalMatch = text.match(/Total:\s+([\d,]+\.\d{2})/)
      const total = totalMatch ? parseFloat(totalMatch[1].replace(/,/g, '')) : null

      // Each invoice row: DOCNUM  DATE  IN  REFERENCE  DUEDATE  AMOUNT
      const lines = []
      const rowRe = /(\S+)\s+(\d{1,2}\/\d{1,2}\/\d{4})\s+IN\s+(.+?)\s+(\d{1,2}\/\d{1,2}\/\d{4})\s+([\d,]+\.\d{2})/g
      let m
      while ((m = rowRe.exec(text)) !== null) {
        const reference = m[3].trim()
        lines.push({
          documentNumber: m[1],
          date: m[2],
          reference,
          dueDate: m[4],
          amount: parseFloat(m[5].replace(/,/g, '')),
          tag: tagBromleyStatement(reference)
        })
      }

      return res.json({ success: true, docType: 'statement', date, year, total, lines })
    }

    // ── Invoice parser ────────────────────────────────────────────────
    // First "Date:" in the document (may be a multi-invoice bundle PDF)
    const dateMatch = text.match(/Date:\s*(\d{1,2}\/\d{1,2}\/(\d{4}))/)
    const date = dateMatch ? dateMatch[1] : null

    // Collect all invoice numbers (may be multiple in a bundle)
    const invoiceNumbers = [...text.matchAll(/^Invoice:\s*([\w\/-]+)/gm)].map(n => n[1])
    const invoiceNumber = invoiceNumbers[0] || null

    // Service period: "Service period Jul-Sep2026" or similar (quarterly billing)
    let startMonth = null, endMonth = null, year = null
    const periodMatch = text.match(/[Ss]ervice period\s+([A-Za-z]{3})-([A-Za-z]{3,9})(\d{2,4})/)
    if (periodMatch) {
      startMonth = MONTH_ABBR[periodMatch[1].toLowerCase()] || null
      endMonth   = MONTH_ABBR[periodMatch[2].slice(0,3).toLowerCase()] || null
      year = parseInt(periodMatch[3])
      if (year < 100) year += 2000
    }
    if (!year && dateMatch) year = parseInt(dateMatch[2])
    // Derive month from invoice date when no service period line is present
    if (!startMonth && date) {
      startMonth = endMonth = parseInt(date.split('/')[0])
    }

    // Sum all "Amount due" values — handles multi-invoice bundle PDFs
    const amountDueMatches = [...text.matchAll(/Amount due\s+([\d,]+\.\d{2})/g)]
    let total = null
    if (amountDueMatches.length > 0) {
      total = parseFloat(amountDueMatches.reduce((s, m) => s + parseFloat(m[1].replace(/,/g, '')), 0).toFixed(2))
    } else {
      const tm = text.match(/Total amount\s+([\d,]+\.\d{2})/)
      if (tm) total = parseFloat(tm[1].replace(/,/g, ''))
    }

    // Line items: step 1 — anchor from right to extract qty + amount
    // Handles variable quantities (2.75 EA, 4.00 EA), hyphens/underscores in codes,
    // and codes concatenated directly with description (e.g. QUEEN-BRLQueen Bed)
    const lineItems = []
    const lineRe = /^(.+?)\s+([\d]+\.[\d]+)\s+EA\s+[\d]+\.[\d]+\s+([\d]+\.[\d]+)\s*$/gm
    let im
    while ((im = lineRe.exec(text)) !== null) {
      const full = im[1].trim()
      const qty = parseFloat(im[2])
      const amount = parseFloat(im[3])
      if (amount <= 0) continue

      let code, desc

      // Step 2a: if there's a space after an all-caps code, split there
      const spaceIdx = full.search(/\s/)
      if (spaceIdx > 0) {
        const prefix = full.slice(0, spaceIdx)
        if (/^[A-Z][A-Z0-9_-]*$/.test(prefix)) {
          code = prefix
          desc = full.slice(spaceIdx + 1)
        }
      }

      // Step 2b: no space (or prefix had lowercase) — find code/description boundary
      // Description always starts with an UpperLower pattern (natural language word)
      if (!code) {
        const split = full.match(/^([A-Z][A-Z0-9_-]*?)([A-Z][a-z].+)$/)
        if (split) { code = split[1]; desc = split[2] }
      }

      if (code && desc) {
        lineItems.push({ code, description: desc.trim(), qty, amount, tag: tagBromleyItem(code, desc) })
      }
    }

    return res.json({
      success: true,
      docType: 'invoice',
      date,
      invoiceNumber,
      invoiceNumbers,
      year,
      startMonth,
      endMonth,
      total,
      lineItems
    })
  } catch (err) {
    console.error('parseBromleyPdf error:', err)
    res.status(500).json({ success: false, message: 'Failed to parse PDF: ' + err.message })
  }
}

// POST /api/financials/:propertyId/year-summary — upsert annual summary (no monthly detail)
const upsertYearSummary = async (req, res) => {
  try {
    const { propertyId } = req.params
    const property = await Property.findOne({ where: { id: propertyId, userId: req.user.id } })
    if (!property) return res.status(404).json({ success: false, message: 'Property not found' })

    const { year, scheduledMortgage, taxesInsurance, notes, ...summaryFields } = req.body
    if (!year) return res.status(400).json({ success: false, message: 'year required' })

    const [config, created] = await FinancialAnnualConfig.findOrCreate({
      where: { propertyId, year },
      defaults: { propertyId, year, scheduledMortgage, taxesInsurance, notes, ...summaryFields }
    })
    if (!created) await config.update({ scheduledMortgage, taxesInsurance, notes, ...summaryFields })

    res.json({ success: true, config })
  } catch (err) {
    console.error('upsertYearSummary error:', err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// PATCH /api/financials/:propertyId/visibility — toggle publiclyVisible
const toggleVisibility = async (req, res) => {
  try {
    const property = await Property.findOne({ where: { id: req.params.propertyId, userId: req.user.id } })
    if (!property) return res.status(404).json({ success: false, message: 'Property not found' })

    await property.update({ publiclyVisible: req.body.publiclyVisible })
    res.json({ success: true, publiclyVisible: property.publiclyVisible })
  } catch (err) {
    console.error('toggleVisibility error:', err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// POST /api/financials/:propertyId/booking-transactions
// Upserts individual bookings by externalBookingId, then recomputes monthly totals
// for all affected months from the stored transactions. Safe to re-import the same
// CSV or overlapping date-range exports — duplicates are silently updated, not added.
const importBookingTransactions = async (req, res) => {
  try {
    const { propertyId } = req.params
    const property = await Property.findOne({ where: { id: propertyId, userId: req.user.id } })
    if (!property) return res.status(404).json({ success: false, message: 'Property not found' })

    const { bookings = [] } = req.body
    if (!bookings.length) return res.json({ success: true, created: 0, updated: 0, monthsRecomputed: 0 })

    let created = 0, updated = 0
    const affectedMonths = new Set()
    const createdIds = []

    for (const b of bookings) {
      if (!b.externalBookingId) continue
      const defaults = {
        propertyId,
        bookingSource: b.bookingSource || 'evolve',
        year: b.year,
        month: b.month,
        grossAmount: parseFloat(b.grossAmount || 0),
        nightsBooked: b.nightsBooked || null,
        checkInDate: b.checkInDate || null,
        checkOutDate: b.checkOutDate || null,
        guestName: b.guestName || null,
        status: b.status || null,
      }
      const [record, wasCreated] = await FinancialBookingTransaction.findOrCreate({
        where: { propertyId, externalBookingId: b.externalBookingId },
        defaults,
      })
      if (!wasCreated) {
        await record.update(defaults)
        updated++
      } else {
        created++
        createdIds.push(record.id)
      }
      affectedMonths.add(`${b.year}-${b.month}`)
    }

    // Recompute monthly totals from all stored transactions for each affected month
    for (const key of affectedMonths) {
      const [yearStr, monthStr] = key.split('-')
      const year = parseInt(yearStr)
      const month = parseInt(monthStr)

      const txns = await FinancialBookingTransaction.findAll({ where: { propertyId, year, month } })
      const grossIncome = txns.reduce((s, t) => s + parseFloat(t.grossAmount || 0), 0)
      const nightsBooked = txns.reduce((s, t) => s + parseInt(t.nightsBooked || 0), 0)
      const numReservations = txns.length

      const [record, wasCreated] = await FinancialMonthly.findOrCreate({
        where: { propertyId, year, month },
        defaults: { propertyId, year, month, grossIncome, nightsBooked, numReservations, syncSource: 'evolve' },
      })
      if (!wasCreated) {
        // Only update the Evolve-sourced fields; preserve manually entered fees/expenses
        await record.update({ grossIncome, nightsBooked, numReservations, syncSource: 'evolve' })
      }
    }

    res.json({ success: true, created, updated, monthsRecomputed: affectedMonths.size, createdIds })
  } catch (err) {
    console.error('importBookingTransactions error:', err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

module.exports = {
  getFinancialProperties,
  getPropertySummary,
  getYearDetail,
  upsertMonthly,
  upsertAnnualConfig,
  upsertFinancialSettings,
  upsertYearSummary,
  deleteMonthly,
  deleteMonthlyBatch,
  deleteYear,
  undoBookingTransactions,
  addExpenseItem,
  updateExpenseItem,
  deleteExpenseItem,
  toggleVisibility,
  parseCaribbeaStatement,
  parseBromleyPdf,
  importBookingTransactions,
}
