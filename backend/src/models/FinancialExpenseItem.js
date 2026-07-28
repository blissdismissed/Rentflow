const { DataTypes, Model } = require('sequelize')
const { sequelize } = require('../config/database')

class FinancialExpenseItem extends Model {}

FinancialExpenseItem.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    propertyId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'properties', key: 'id' }
    },
    year: { type: DataTypes.INTEGER, allowNull: false },
    month: { type: DataTypes.INTEGER, allowNull: false },
    expenseDate: { type: DataTypes.DATEONLY, allowNull: true },
    expenseName: { type: DataTypes.STRING(255), allowNull: true },
    vendor: { type: DataTypes.STRING(255), allowNull: true },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    qty: { type: DataTypes.DECIMAL(10, 4), allowNull: true },
    tag: {
      type: DataTypes.STRING(50),
      defaultValue: 'other',
      comment: 'utilities, housekeeping, maintenance, hoa, other'
    }
  },
  {
    sequelize,
    modelName: 'FinancialExpenseItem',
    tableName: 'financial_expense_items',
    timestamps: true,
    indexes: [{ fields: ['propertyId', 'year', 'month'] }]
  }
)

module.exports = FinancialExpenseItem
