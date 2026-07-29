const { DataTypes, Model } = require('sequelize')
const { sequelize } = require('../config/database')

class FinancialBookingTransaction extends Model {}

FinancialBookingTransaction.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    propertyId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'properties', key: 'id' },
    },
    externalBookingId: { type: DataTypes.STRING, allowNull: false },
    bookingSource: { type: DataTypes.STRING(50), allowNull: true },
    year: { type: DataTypes.INTEGER, allowNull: false },
    month: { type: DataTypes.INTEGER, allowNull: false },
    grossAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    managementFee: { type: DataTypes.DECIMAL(10, 2), allowNull: true, defaultValue: 0 },
    nightsBooked: { type: DataTypes.INTEGER, allowNull: true },
    checkInDate: { type: DataTypes.DATEONLY, allowNull: true },
    checkOutDate: { type: DataTypes.DATEONLY, allowNull: true },
    guestName: { type: DataTypes.STRING, allowNull: true },
    status: { type: DataTypes.STRING(50), allowNull: true },
  },
  {
    sequelize,
    modelName: 'FinancialBookingTransaction',
    tableName: 'financial_booking_transactions',
    timestamps: true,
    indexes: [
      { unique: true, fields: ['propertyId', 'externalBookingId'], name: 'fbt_property_external_booking_unique' },
      { fields: ['propertyId', 'year', 'month'] },
    ],
  }
)

module.exports = FinancialBookingTransaction
