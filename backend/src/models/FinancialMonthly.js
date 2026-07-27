const { DataTypes, Model } = require('sequelize')
const { sequelize } = require('../config/database')

class FinancialMonthly extends Model {
  get grossExpenses() {
    return (
      parseFloat(this.cleaningFee || 0) +
      parseFloat(this.utilities || 0) +
      parseFloat(this.maintenance || 0) +
      parseFloat(this.otherExpenses || 0) +
      parseFloat(this.platformCharges || 0)
    )
  }

  get netIncome() {
    return parseFloat(this.grossIncome || 0) - parseFloat(this.managementFee || 0) - this.grossExpenses
  }

  get percentageOfIncome() {
    const gross = parseFloat(this.grossIncome || 0)
    if (gross === 0) return 0
    return this.netIncome / gross
  }

  get avgLengthOfStay() {
    const res = parseInt(this.numReservations || 0)
    if (res === 0) return 0
    return parseFloat(this.nightsBooked || 0) / res
  }

  get occupancyRatio() {
    const daysInMonth = new Date(this.year, this.month, 0).getDate()
    return parseFloat(this.nightsBooked || 0) / daysInMonth
  }
}

FinancialMonthly.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    propertyId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'properties', key: 'id' }
    },
    year: { type: DataTypes.INTEGER, allowNull: false },
    month: { type: DataTypes.INTEGER, allowNull: false },
    grossIncome: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    managementFee: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    cleaningFee: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    utilities: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    maintenance: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    otherExpenses: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    platformCharges: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    nightsBooked: { type: DataTypes.INTEGER, defaultValue: 0 },
    numReservations: { type: DataTypes.INTEGER, defaultValue: 0 },
    hoaPayment: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    actualMortgagePaid: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    syncSource: { type: DataTypes.STRING(20), defaultValue: 'manual' },
    lastSyncedAt: { type: DataTypes.DATE, allowNull: true }
  },
  {
    sequelize,
    modelName: 'FinancialMonthly',
    tableName: 'financial_monthly',
    timestamps: true,
    indexes: [
      { unique: true, fields: ['propertyId', 'year', 'month'] },
      { fields: ['propertyId', 'year'] }
    ]
  }
)

module.exports = FinancialMonthly
