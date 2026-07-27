const { DataTypes, Model } = require('sequelize')
const { sequelize } = require('../config/database')

class PropertyFinancialSettings extends Model {}

PropertyFinancialSettings.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    propertyId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: { model: 'properties', key: 'id' }
    },
    purchasePrice: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    dataSource: {
      type: DataTypes.STRING(20),
      defaultValue: 'manual',
      comment: 'evolve, caribbean, manual'
    }
  },
  {
    sequelize,
    modelName: 'PropertyFinancialSettings',
    tableName: 'property_financial_settings',
    timestamps: true
  }
)

module.exports = PropertyFinancialSettings
