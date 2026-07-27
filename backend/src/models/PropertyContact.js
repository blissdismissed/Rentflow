const { DataTypes, Model } = require('sequelize')
const { sequelize } = require('../config/database')

class PropertyContact extends Model {}

PropertyContact.init(
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
    contactType: {
      type: DataTypes.ENUM('owner', 'guest'),
      allowNull: false,
      comment: 'Type of contact - owner or guest contact'
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Contact person full name'
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true
      },
      comment: 'Contact email address'
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Contact phone number'
    },
    isPrimary: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether this is the primary contact for this type'
    },
    receiveBookingNotifications: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Whether to receive booking confirmation emails'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Additional notes about this contact'
    }
  },
  {
    sequelize,
    modelName: 'PropertyContact',
    tableName: 'property_contacts',
    timestamps: true,
    indexes: [
      {
        fields: ['propertyId']
      },
      {
        fields: ['contactType']
      },
      {
        fields: ['email']
      }
    ]
  }
)

module.exports = PropertyContact
