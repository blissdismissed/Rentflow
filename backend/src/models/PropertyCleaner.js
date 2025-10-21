const { DataTypes, Model } = require('sequelize')
const { sequelize } = require('../config/database')

class PropertyCleaner extends Model {}

PropertyCleaner.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    propertyId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'properties',
        key: 'id'
      }
    },
    cleanerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'cleaners',
        key: 'id'
      }
    },
    assignedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  },
  {
    sequelize,
    modelName: 'PropertyCleaner',
    tableName: 'property_cleaners',
    timestamps: true,
    indexes: [
      {
        fields: ['propertyId']
      },
      {
        fields: ['cleanerId']
      },
      {
        unique: true,
        fields: ['propertyId', 'cleanerId']
      }
    ]
  }
)

module.exports = PropertyCleaner
