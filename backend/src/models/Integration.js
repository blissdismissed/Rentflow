const { DataTypes, Model } = require('sequelize')
const { sequelize } = require('../config/database')

class Integration extends Model {}

Integration.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    propertyId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'properties',
        key: 'id'
      }
    },
    platform: {
      type: DataTypes.ENUM('airbnb', 'vrbo', 'booking_com', 'ical'),
      allowNull: false
    },
    platformListingId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    accessToken: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    refreshToken: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    tokenExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    icalUrl: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    config: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    syncEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    lastSyncedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    syncStatus: {
      type: DataTypes.ENUM('active', 'error', 'disabled'),
      defaultValue: 'active'
    },
    syncErrors: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  },
  {
    sequelize,
    modelName: 'Integration',
    tableName: 'integrations',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['propertyId']
      },
      {
        fields: ['platform']
      },
      {
        unique: true,
        fields: ['userId', 'propertyId', 'platform']
      }
    ]
  }
)

module.exports = Integration
