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
    },
    externalId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'External reservation ID from platforms like Airbnb, VRBO'
    },
    platform: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Source platform (airbnb, vrbo, booking_com, etc.)'
    },
    platformFee: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      comment: 'Fee charged by the platform'
    },
    netAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Net amount after platform fees'
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Additional data from external platforms'
    },
    depositAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      comment: '10% deposit amount'
    },
    depositPaid: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether deposit has been paid'
    },
    depositPaidAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When deposit was paid'
    },
    balanceAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      comment: 'Remaining balance (90%)'
    },
    balancePaid: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether balance has been paid'
    },
    balancePaidAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When balance was paid'
    },
    stripePaymentIntentId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Stripe PaymentIntent ID for deposit'
    },
    bookingStatus: {
      type: DataTypes.ENUM('requested', 'approved', 'declined', 'confirmed', 'completed', 'cancelled'),
      defaultValue: 'requested',
      comment: 'Booking request workflow status'
    },
    hostMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Message from host (decline reason, etc.)'
    },
    guestMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Message from guest with booking request'
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
