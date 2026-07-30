const { DataTypes, Model } = require('sequelize')
const { sequelize } = require('../config/database')

class PropertyIcalSource extends Model {}

PropertyIcalSource.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    propertyId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'properties', key: 'id' }
    },
    channel: {
      type: DataTypes.ENUM('airbnb', 'vrbo', 'booking_com', 'evolve', 'other'),
      allowNull: false
    },
    channelName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Display name override (e.g. "VRBO Listing #123")'
    },
    icalUrl: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    lastSyncedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    lastSyncStatus: {
      type: DataTypes.ENUM('pending', 'success', 'error'),
      defaultValue: 'pending'
    },
    lastSyncError: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    bookingCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Number of active blocks imported from this source'
    }
  },
  {
    sequelize,
    modelName: 'PropertyIcalSource',
    tableName: 'property_ical_sources',
    timestamps: true
  }
)

module.exports = PropertyIcalSource
