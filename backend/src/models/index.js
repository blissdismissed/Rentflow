const User = require('./User')
const Property = require('./Property')
const Booking = require('./Booking')
const Payment = require('./Payment')
const Integration = require('./Integration')
const Financial = require('./Financial')
const Cleaner = require('./Cleaner')
const PropertyCleaner = require('./PropertyCleaner')
const PropertyContact = require('./PropertyContact')
const Guest = require('./Guest')
const GuestStay = require('./GuestStay')
const PropertySettings = require('./PropertySettings')
const PropertyLockPin = require('./PropertyLockPin')
const EmailTemplate = require('./EmailTemplate')
const Review = require('./Review')

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

// Cleaner associations
User.hasOne(Cleaner, { foreignKey: 'userId', as: 'cleanerProfile' })
Cleaner.belongsTo(User, { foreignKey: 'userId', as: 'user' })

Cleaner.belongsToMany(Property, { through: PropertyCleaner, foreignKey: 'cleanerId', as: 'properties' })
Property.belongsToMany(Cleaner, { through: PropertyCleaner, foreignKey: 'propertyId', as: 'cleaners' })

PropertyCleaner.belongsTo(Property, { foreignKey: 'propertyId', as: 'property' })
PropertyCleaner.belongsTo(Cleaner, { foreignKey: 'cleanerId', as: 'cleaner' })

// Property Contact associations
Property.hasMany(PropertyContact, { foreignKey: 'propertyId', as: 'contacts' })
PropertyContact.belongsTo(Property, { foreignKey: 'propertyId', as: 'property' })

// Guest associations
Guest.hasMany(GuestStay, { foreignKey: 'guestId', as: 'stays' })
GuestStay.belongsTo(Guest, { foreignKey: 'guestId', as: 'guest' })

Property.hasMany(GuestStay, { foreignKey: 'propertyId', as: 'guestStays' })
GuestStay.belongsTo(Property, { foreignKey: 'propertyId', as: 'property' })

Booking.hasOne(GuestStay, { foreignKey: 'bookingId', as: 'guestStay' })
GuestStay.belongsTo(Booking, { foreignKey: 'bookingId', as: 'booking' })

// Many-to-many through GuestStay
Guest.belongsToMany(Property, { through: GuestStay, foreignKey: 'guestId', as: 'propertiesStayed' })
Property.belongsToMany(Guest, { through: GuestStay, foreignKey: 'propertyId', as: 'guests' })

// Property Settings associations
Property.hasOne(PropertySettings, { foreignKey: 'propertyId', as: 'settings' })
PropertySettings.belongsTo(Property, { foreignKey: 'propertyId', as: 'property' })

// Lock PIN associations
Property.hasMany(PropertyLockPin, { foreignKey: 'propertyId', as: 'lockPins' })
PropertyLockPin.belongsTo(Property, { foreignKey: 'propertyId', as: 'property' })

Booking.belongsTo(PropertyLockPin, { foreignKey: 'lockPinId', as: 'lockPin' })
PropertyLockPin.hasMany(Booking, { foreignKey: 'lockPinId', as: 'bookings' })

// Email Template associations
Property.hasMany(EmailTemplate, { foreignKey: 'propertyId', as: 'emailTemplates' })
EmailTemplate.belongsTo(Property, { foreignKey: 'propertyId', as: 'property' })

// Review associations
Property.hasMany(Review, { foreignKey: 'propertyId', as: 'reviews' })
Review.belongsTo(Property, { foreignKey: 'propertyId', as: 'Property' })

Booking.hasMany(Review, { foreignKey: 'bookingId', as: 'reviews' })
Review.belongsTo(Booking, { foreignKey: 'bookingId', as: 'booking' })

Guest.hasMany(Review, { foreignKey: 'guestId', as: 'reviews' })
Review.belongsTo(Guest, { foreignKey: 'guestId', as: 'guest' })

module.exports = {
  User,
  Property,
  Booking,
  Payment,
  Integration,
  Financial,
  Cleaner,
  PropertyCleaner,
  PropertyContact,
  Guest,
  GuestStay,
  PropertySettings,
  PropertyLockPin,
  EmailTemplate,
  Review
}
