const { DataTypes, Model } = require('sequelize')
const { sequelize } = require('../config/database')

class Booking extends Model {}

Booking.init(
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
    guestName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    guestEmail: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    guestPhone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    numberOfGuests: {
      type: DataTypes.INTEGER,
      defaultValue: 1
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
    baseAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    cleaningFee: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    serviceFee: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    taxes: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    paidAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    channel: {
      type: DataTypes.ENUM('direct', 'airbnb', 'vrbo', 'booking_com', 'other'),
      defaultValue: 'direct'
    },
    channelBookingId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'),
      defaultValue: 'pending'
    },
    paymentStatus: {
      type: DataTypes.ENUM('pending', 'partial', 'paid', 'refunded'),
      defaultValue: 'pending'
    },
    specialRequests: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    confirmationCode: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true
    },
    cancelledAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    cancellationReason: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'Booking',
    tableName: 'bookings',
    timestamps: true,
    indexes: [
      {
        fields: ['propertyId']
      },
      {
        fields: ['checkIn', 'checkOut']
      },
      {
        fields: ['status']
      },
      {
        fields: ['channel']
      },
      {
        fields: ['confirmationCode']
      }
    ],
    hooks: {
      beforeValidate: (booking) => {
        if (booking.checkIn && booking.checkOut) {
          const checkIn = new Date(booking.checkIn)
          const checkOut = new Date(booking.checkOut)
          booking.nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))
        }
      }
    }
  }
)

module.exports = Booking
