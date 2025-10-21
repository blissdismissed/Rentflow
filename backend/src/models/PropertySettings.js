const { DataTypes, Model } = require('sequelize')
const { sequelize } = require('../config/database')

class PropertySettings extends Model {}

PropertySettings.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    propertyId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'properties',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      comment: 'Property these settings belong to'
    },
    rotatingPinsEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether rotating lock PIN feature is enabled'
    },
    currentPinIndex: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Current index in PIN rotation sequence'
    },
    preStayEmailEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether pre-stay emails are enabled'
    },
    preStayEmailDays: {
      type: DataTypes.INTEGER,
      defaultValue: 3,
      comment: 'Days before check-in to send pre-stay email'
    },
    postStayEmailEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether post-stay emails are enabled'
    },
    postStayEmailDays: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: 'Days after check-out to send post-stay email'
    },
    checkInInstructions: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Default check-in instructions'
    },
    wifiNetwork: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'WiFi network name'
    },
    wifiPassword: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'WiFi password'
    },
    parkingInstructions: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Parking instructions'
    },
    houseRules: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'House rules for guests'
    }
  },
  {
    sequelize,
    modelName: 'PropertySettings',
    tableName: 'property_settings',
    timestamps: true,
    indexes: [
      {
        fields: ['propertyId'],
        unique: true
      }
    ]
  }
)

module.exports = PropertySettings
