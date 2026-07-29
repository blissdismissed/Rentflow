const { DataTypes, Model } = require('sequelize')
const { sequelize } = require('../config/database')

class DealNote extends Model {}

DealNote.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    dealId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'deals', key: 'id' }
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    text: { type: DataTypes.TEXT, allowNull: false }
  },
  {
    sequelize,
    modelName: 'DealNote',
    tableName: 'deal_notes',
    timestamps: true,
    indexes: [{ fields: ['dealId'] }]
  }
)

module.exports = DealNote
