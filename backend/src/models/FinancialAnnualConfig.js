const { DataTypes, Model } = require('sequelize')
const { sequelize } = require('../config/database')

class FinancialAnnualConfig extends Model {}

FinancialAnnualConfig.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    propertyId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'properties', key: 'id' }
    },
    year: { type: DataTypes.INTEGER, allowNull: false },
    scheduledMortgage: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    taxesInsurance: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    // Annual summary totals (used when monthly detail is not available)
    grossIncomeAnnual:     { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    managementFeeAnnual:   { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    platformChargesAnnual: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    cleaningFeeAnnual:     { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    utilitiesAnnual:       { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    maintenanceAnnual:     { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    otherExpensesAnnual:   { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    nightsBookedAnnual:    { type: DataTypes.INTEGER, allowNull: true },
    numReservationsAnnual: { type: DataTypes.INTEGER, allowNull: true },
    hoaAnnual:             { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    actualMortgageAnnual:  { type: DataTypes.DECIMAL(12, 2), allowNull: true }
  },
  {
    sequelize,
    modelName: 'FinancialAnnualConfig',
    tableName: 'financial_annual_config',
    timestamps: true,
    indexes: [{ unique: true, fields: ['propertyId', 'year'] }]
  }
)

module.exports = FinancialAnnualConfig
