const { DataTypes, Model } = require('sequelize')
const { sequelize } = require('../config/database')

class Property extends Model {}

Property.init(
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
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('house', 'condo', 'apartment', 'villa', 'cabin', 'other'),
      defaultValue: 'house'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false
    },
    state: {
      type: DataTypes.STRING,
      allowNull: false
    },
    zipCode: {
      type: DataTypes.STRING,
      allowNull: false
    },
    country: {
      type: DataTypes.STRING,
      defaultValue: 'USA'
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true
    },
    bedrooms: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    bathrooms: {
      type: DataTypes.DECIMAL(3, 1),
      defaultValue: 1.0
    },
    maxGuests: {
      type: DataTypes.INTEGER,
      defaultValue: 2
    },
    squareFeet: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    amenities: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    images: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    basePrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    cleaningFee: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    securityDeposit: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    pricingRules: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'pending', 'archived'),
      defaultValue: 'pending'
    },
    customBookingUrl: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true
    },
    bookingSettings: {
      type: DataTypes.JSONB,
      defaultValue: {
        minStay: 1,
        maxStay: 30,
        checkInTime: '15:00',
        checkOutTime: '11:00',
        instantBooking: false,
        cancellationPolicy: 'moderate'
      }
    },
    isListed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  },
  {
    sequelize,
    modelName: 'Property',
    tableName: 'properties',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['customBookingUrl']
      }
    ]
  }
)

module.exports = Property
