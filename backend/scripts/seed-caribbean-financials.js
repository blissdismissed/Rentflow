/**
 * Seed Caribbean - 1225 financial data
 * Run from project root: node backend/scripts/seed-caribbean-financials.js
 *
 * Seeded data:
 *   - Annual configs (scheduled mortgage + T&I) for 2018–2024
 *   - Full monthly data for 2024
 *   - 2018–2023: annual configs only (monthly data not available — enter via UI or share year CSVs)
 */

require('dotenv').config({ path: './backend/.env' })
const { sequelize } = require('./src/config/database')
const Property = require('./src/models/Property')
const PropertyFinancialSettings = require('./src/models/PropertyFinancialSettings')
const FinancialAnnualConfig = require('./src/models/FinancialAnnualConfig')
const FinancialMonthly = require('./src/models/FinancialMonthly')

const SLUG = 'caribbean-1225-myrtle-beach'
const PURCHASE_PRICE = 149900.00

// Annual configs — scheduled monthly mortgage and annual T&I
// Mortgage derived from annual total / months active that year
const ANNUAL_CONFIGS = [
  { year: 2018, scheduledMortgage: 901.00,  taxesInsurance: 2300.00, notes: 'First year, rental started in April' },
  { year: 2019, scheduledMortgage: 901.00,  taxesInsurance: 2300.00, notes: 'King Conversion, Major PM' },
  { year: 2020, scheduledMortgage: 901.00,  taxesInsurance: 2300.00, notes: 'COVID' },
  { year: 2021, scheduledMortgage: 967.00,  taxesInsurance: 2300.00, notes: 'Boom in Covid domestic travel' },
  { year: 2022, scheduledMortgage: 1153.00, taxesInsurance: 2384.00, notes: 'Cash Out Refi $50k' },
  { year: 2023, scheduledMortgage: 1343.25, taxesInsurance: 2384.00, notes: '' },
  { year: 2024, scheduledMortgage: 1339.00, taxesInsurance: 2384.00, notes: '' },
]

// Full monthly data for 2024 (from spreadsheet)
// platformCharges = the "Charges" column; hoaPayment = monthly HOA
const MONTHLY_2024 = [
  { month:  1, grossIncome:    694.89, managementFee:   269.59, platformCharges:  54.09, nightsBooked:  9, numReservations:  4, hoaPayment: 706.00, actualMortgagePaid: 1356.00 },
  { month:  2, grossIncome:    884.30, managementFee:   333.64, platformCharges:  85.31, nightsBooked: 11, numReservations:  7, hoaPayment: 706.00, actualMortgagePaid: 1356.00 },
  { month:  3, grossIncome:   3116.28, managementFee:  1209.11, platformCharges: 190.91, nightsBooked: 24, numReservations:  7, hoaPayment: 706.00, actualMortgagePaid: 1356.00 },
  { month:  4, grossIncome:   2041.70, managementFee:   792.21, platformCharges: 663.61, nightsBooked: 16, numReservations:  8, hoaPayment: 706.00, actualMortgagePaid: 1356.00 },
  { month:  5, grossIncome:   3563.62, managementFee:  1382.65, platformCharges: 278.63, nightsBooked: 26, numReservations: 10, hoaPayment: 706.00, actualMortgagePaid: 1356.00 },
  { month:  6, grossIncome:   6074.72, managementFee:  2357.03, platformCharges: 208.73, nightsBooked: 28, numReservations:  8, hoaPayment: 706.00, actualMortgagePaid: 1356.00 },
  { month:  7, grossIncome:   6686.31, managementFee:  2594.32, platformCharges: 350.83, nightsBooked: 31, numReservations:  9, hoaPayment: 706.00, actualMortgagePaid: 1356.00 },
  { month:  8, grossIncome:   3396.40, managementFee:  1317.89, platformCharges: 161.32, nightsBooked: 29, numReservations: 10, hoaPayment: 706.00, actualMortgagePaid: 1356.00 },
  { month:  9, grossIncome:   1804.54, managementFee:   700.15, platformCharges: 317.61, nightsBooked: 17, numReservations:  5, hoaPayment: 706.00, actualMortgagePaid: 1356.00 },
  { month: 10, grossIncome:      0.00, managementFee:     0.00, platformCharges:  44.00, nightsBooked:  0, numReservations:  0, hoaPayment: 706.00, actualMortgagePaid: 1356.00 },
  { month: 11, grossIncome:    107.04, managementFee:    41.54, platformCharges:  57.26, nightsBooked:  2, numReservations:  1, hoaPayment: 706.00, actualMortgagePaid: 1356.00 },
  { month: 12, grossIncome:    721.14, managementFee:   279.83, platformCharges: 474.72, nightsBooked: 12, numReservations:  6, hoaPayment: 706.00, actualMortgagePaid: 1356.00 },
]

async function seed() {
  try {
    await sequelize.authenticate()
    console.log('✅ DB connected\n')

    const property = await Property.findOne({ where: { slug: SLUG } })
    if (!property) throw new Error(`Property not found with slug: ${SLUG}. Run seed-caribbean.js first.`)
    console.log(`✅ Found property: ${property.name} (${property.id})`)

    // Upsert financial settings
    const [settings] = await PropertyFinancialSettings.findOrCreate({
      where: { propertyId: property.id },
      defaults: { purchasePrice: PURCHASE_PRICE, dataSource: 'caribbean' }
    })
    await settings.update({ purchasePrice: PURCHASE_PRICE, dataSource: 'caribbean' })
    console.log(`✅ Financial settings: purchase price $${PURCHASE_PRICE.toLocaleString()}`)

    // Upsert annual configs
    console.log('\n📅 Seeding annual configs...')
    for (const config of ANNUAL_CONFIGS) {
      await FinancialAnnualConfig.upsert({
        propertyId: property.id,
        ...config
      })
      console.log(`   ${config.year}: mortgage $${config.scheduledMortgage}/mo, T&I $${config.taxesInsurance}/yr`)
    }

    // Upsert 2024 monthly data
    console.log('\n📆 Seeding 2024 monthly data...')
    for (const m of MONTHLY_2024) {
      await FinancialMonthly.upsert({
        propertyId: property.id,
        year: 2024,
        syncSource: 'manual',
        cleaningFee: 0,
        utilities: 0,
        maintenance: 0,
        otherExpenses: 0,
        ...m
      })
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
      console.log(`   ${months[m.month - 1]}: $${m.grossIncome.toFixed(2)} gross, ${m.nightsBooked} nights`)
    }

    console.log(`
🎉 Done! Caribbean - 1225 financial data seeded.

   Annual configs: 2018–2024
   Monthly detail: 2024 only

   To add 2018–2023 monthly detail:
   → Share the individual year CSVs from the spreadsheet
   → Or enter them manually via the Finances tab in the dashboard
`)
    process.exit(0)
  } catch (err) {
    console.error('❌ Error:', err.message)
    process.exit(1)
  }
}

seed()
