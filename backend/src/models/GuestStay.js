const { DataTypes, Model } = require('sequelize')
const { sequelize } = require('../config/database')

class GuestStay extends Model {}

GuestStay.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    guestId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'guests',
        key: 'id'
      }
    },
    propertyId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'properties',
        key: 'id'
      }
    },
    bookingId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'bookings',
        key: 'id'
      }
    },
    checkIn: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    checkOut: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    nights: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    numberOfGuests: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 5
      },
      comment: 'Owner rating of guest (1-5)'
    },
    review: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Owner review/notes about this stay'
    }
  },
  {
    sequelize,
    modelName: 'GuestStay',
    tableName: 'guest_stays',
    timestamps: true,
    indexes: [
      {
        fields: ['guestId']
      },
      {
        fields: ['propertyId']
      },
      {
        fields: ['bookingId']
      },
      {
        fields: ['checkIn', 'checkOut']
      }
    ]
  }
)

module.exports = GuestStay
