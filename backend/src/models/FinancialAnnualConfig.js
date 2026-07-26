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
    notes: { type: DataTypes.TEXT, allowNull: true }
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
