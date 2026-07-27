const { DataTypes, Model } = require('sequelize')
const { sequelize } = require('../config/database')

class PropertyLockPin extends Model {}

PropertyLockPin.init(
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
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      comment: 'Property this PIN belongs to'
    },
    pin: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Encrypted lock PIN code'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Whether this PIN is active and available for rotation'
    },
    orderIndex: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Order in rotation sequence (0-indexed)'
    },
    lastUsedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When this PIN was last assigned to a guest'
    },
    usageCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'How many times this PIN has been assigned'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Optional notes about this PIN'
    }
  },
  {
    sequelize,
    modelName: 'PropertyLockPin',
    tableName: 'property_lock_pins',
    timestamps: true,
    indexes: [
      {
        fields: ['propertyId']
      },
      {
        fields: ['propertyId', 'orderIndex'],
        unique: true
      }
    ]
  }
)

module.exports = PropertyLockPin
