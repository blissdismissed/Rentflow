/**
 * Seed Caribbean - 1225 (Myrtle Beach) Property
 * Run with: node backend/scripts/seed-caribbean.js
 *
 * NOTE: For production, create the property through the UI instead.
 * This script is for local dev only.
 */

require('dotenv').config({ path: './backend/.env' })
const { sequelize } = require('../src/config/database')
const Property = require('../src/models/Property')
const PropertyFinancialSettings = require('../src/models/PropertyFinancialSettings')
const User = require('../src/models/User')

const USER_EMAIL = 'aspiretowards@gmail.com'

async function seedCaribbean() {
  try {
    console.log('🌱 Seeding Caribbean - 1225 property...')
    await sequelize.authenticate()
    console.log('✅ Database connected')

    const user = await User.findOne({ where: { email: USER_EMAIL } })
    if (!user) throw new Error(`User not found: ${USER_EMAIL}`)
    console.log(`✅ Found user: ${user.firstName} ${user.lastName}`)

    const slug = 'caribbean-1225-myrtle-beach'
    let property = await Property.findOne({ where: { slug } })

    if (property) {
      console.log('⚠️  Property already exists, updating...')
      await property.update(getPropertyData(user.id))
    } else {
      property = await Property.create(getPropertyData(user.id))
      console.log(`✅ Property created: ${property.id}`)
    }

    // Upsert financial settings
    const [settings, created] = await PropertyFinancialSettings.findOrCreate({
      where: { propertyId: property.id },
      defaults: { purchasePrice: 149900.00, dataSource: 'caribbean' }
    })
    if (!created) {
      await settings.update({ purchasePrice: 149900.00, dataSource: 'caribbean' })
    }
    console.log('✅ Financial settings saved (purchase price: $149,900)')

    console.log(`\n🎉 Done! Property ID: ${property.id}`)
    console.log('   publiclyVisible = false (private until toggled on)\n')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

function getPropertyData(userId) {
  return {
    userId,
    name: 'Caribbean - 1225',
    type: 'condo',
    description: 'Ocean-view condo at Caribbean Resort, Myrtle Beach, SC.',
    address: '3000 N Ocean Blvd, Unit 1225',
    city: 'Myrtle Beach',
    state: 'SC',
    zipCode: '29577',
    country: 'USA',
    bedrooms: 1,
    bathrooms: 1.0,
    maxGuests: 4,
    amenities: ['Pool', 'Ocean view', 'WiFi', 'Parking', 'Beach access'],
    images: [],
    basePrice: 150.00,
    cleaningFee: 0,
    securityDeposit: 0,
    pricingRules: [],
    status: 'inactive',
    bookingSettings: {
      minStay: 1,
      maxStay: 30,
      checkInTime: '16:00',
      checkOutTime: '10:00',
      instantBooking: false,
      cancellationPolicy: 'moderate'
    },
    isListed: false,
    isActive: false,
    minNights: 1,
    maxNights: 30,
    slug: 'caribbean-1225-myrtle-beach',
    instantBook: false,
    publiclyVisible: false
  }
}

seedCaribbean()
