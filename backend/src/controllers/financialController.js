const Property = require('../models/Property')
const PropertyFinancialSettings = require('../models/PropertyFinancialSettings')
const FinancialAnnualConfig = require('../models/FinancialAnnualConfig')
const FinancialMonthly = require('../models/FinancialMonthly')
const FinancialExpenseItem = require('../models/FinancialExpenseItem')

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

    // Years with only annual summary (no monthly records)
    const yearsFromSummary = allConfigs
      .filter(c => c.grossIncomeAnnual != null && !yearMap[c.year])
      .map(config => {
        const grossIncome     = parseFloat(config.grossIncomeAnnual || 0)
        const managementFee   = parseFloat(config.managementFeeAnnual || 0)
        const platformCharges = parseFloat(config.platformChargesAnnual || 0)
        const cleaningFee     = parseFloat(config.cleaningFeeAnnual || 0)
        const utilities       = parseFloat(config.utilitiesAnnual || 0)
        const maintenance     = parseFloat(config.maintenanceAnnual || 0)
        const otherExpenses   = parseFloat(config.otherExpensesAnnual || 0)
        const grossExpenses   = platformCharges + cleaningFee + utilities + maintenance + otherExpenses
        const netIncome       = grossIncome - managementFee - grossExpenses
        const hoaPayment      = parseFloat(config.hoaAnnual || 0)
        const actualMortgage  = parseFloat(config.actualMortgageAnnual || 0)
        const ti              = parseFloat(config.taxesInsurance || 0)
        const scheduledMort   = parseFloat(config.scheduledMortgage || 0)
        const nightsBooked    = parseInt(config.nightsBookedAnnual || 0)
        const numReservations = parseInt(config.numReservationsAnnual || 0)

        return {
          year: config.year,
          hasMonthlyDetail: false,
          grossIncome, managementFee, platformCharges, cleaningFee,
          utilities, maintenance, otherExpenses, grossExpenses, netIncome,
          nightsBooked, numReservations,
          hoaPayment, actualMortgagePaid: actualMortgage,
          taxesInsurance: ti, scheduledMortgage: scheduledMort,
          grossProfits: netIncome - hoaPayment - actualMortgage - ti,
          percentageOfIncome: grossIncome > 0 ? netIncome / grossIncome : 0,
          avgLengthOfStay: numReservations > 0 ? nightsBooked / numReservations : 0,
          noi: purchasePrice > 0 ? (netIncome - hoaPayment) / purchasePrice : null,
          notes: config.notes || '',
        }
      })

    const years = [...yearsWithDetail, ...yearsFromSummary].sort((a, b) => a.year - b.year)

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
const upsertMonthly = async (req, res) => {
  try {
    const { propertyId } = req.params
    const property = await Property.findOne({ where: { id: propertyId, userId: req.user.id } })
    if (!property) return res.status(404).json({ success: false, message: 'Property not found' })

    const { year, month, ...data } = req.body
    if (!year || !month) return res.status(400).json({ success: false, message: 'year and month required' })

    const [record, created] = await FinancialMonthly.findOrCreate({
      where: { propertyId, year, month },
      defaults: { propertyId, year, month, ...data }
    })
    if (!created) await record.update(data)

    res.json({ success: true, record })
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
    const [settings, created] = await PropertyFinancialSettings.findOrCreate({
      where: { propertyId },
      defaults: { propertyId, purchasePrice, dataSource }
    })
    if (!created) await settings.update({ purchasePrice, dataSource })

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

// POST /api/financials/parse-caribbean-statement — parse a Caribbean Resorts PDF statement
const parseCaribbeaStatement = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' })

    const pdfParse = require('pdf-parse')
    const data = await pdfParse(req.file.buffer)
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
    let platformCharges = 0

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
      else platformCharges += amount
    }

    // Net due to owner
    const netMatch = text.match(/Net Due to \(from\) Owner\s+\$([0-9,]+\.?\d*)/)
    const netDue = netMatch ? parseFloat(netMatch[1].replace(/,/g, '')) : null

    res.json({
      success: true,
      parsed: { month, year, grossIncome, managementFee, platformCharges: parseFloat(platformCharges.toFixed(2)), nightsBooked, numReservations, rawExpenses, netDue }
    })
  } catch (err) {
    console.error('parseCaribbeaStatement error:', err)
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

module.exports = {
  getFinancialProperties,
  getPropertySummary,
  getYearDetail,
  upsertMonthly,
  upsertAnnualConfig,
  upsertFinancialSettings,
  upsertYearSummary,
  addExpenseItem,
  updateExpenseItem,
  deleteExpenseItem,
  toggleVisibility,
  parseCaribbeaStatement,
}
