const User = require('./User')
const Property = require('./Property')
const Booking = require('./Booking')
const Payment = require('./Payment')
const Integration = require('./Integration')
const Financial = require('./Financial')

// Define associations
User.hasMany(Property, { foreignKey: 'userId', as: 'properties' })
Property.belongsTo(User, { foreignKey: 'userId', as: 'owner' })

Property.hasMany(Booking, { foreignKey: 'propertyId', as: 'bookings' })
Booking.belongsTo(Property, { foreignKey: 'propertyId', as: 'property' })

Booking.hasMany(Payment, { foreignKey: 'bookingId', as: 'payments' })
Payment.belongsTo(Booking, { foreignKey: 'bookingId', as: 'booking' })

User.hasMany(Integration, { foreignKey: 'userId', as: 'integrations' })
Integration.belongsTo(User, { foreignKey: 'userId', as: 'user' })

Property.hasMany(Integration, { foreignKey: 'propertyId', as: 'integrations' })
Integration.belongsTo(Property, { foreignKey: 'propertyId', as: 'property' })

User.hasMany(Financial, { foreignKey: 'userId', as: 'financials' })
Financial.belongsTo(User, { foreignKey: 'userId', as: 'user' })

Property.hasMany(Financial, { foreignKey: 'propertyId', as: 'financials' })
Financial.belongsTo(Property, { foreignKey: 'propertyId', as: 'property' })

Booking.hasMany(Financial, { foreignKey: 'bookingId', as: 'financials' })
Financial.belongsTo(Booking, { foreignKey: 'bookingId', as: 'booking' })

module.exports = {
  User,
  Property,
  Booking,
  Payment,
  Integration,
  Financial
}
