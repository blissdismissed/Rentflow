const { DataTypes, Model } = require('sequelize')
const { sequelize } = require('../config/database')

class EmailTemplate extends Model {}

EmailTemplate.init(
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
      comment: 'Property this email template belongs to'
    },
    templateType: {
      type: DataTypes.ENUM('pre_stay', 'post_stay', 'booking_confirmation', 'custom'),
      allowNull: false,
      defaultValue: 'pre_stay',
      comment: 'Type of email template'
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Email subject line with variable support'
    },
    htmlContent: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'HTML email content with variable placeholders'
    },
    plainTextContent: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Plain text version of email'
    },
    daysBeforeCheckIn: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'For pre-stay emails: days before check-in to send'
    },
    daysAfterCheckOut: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'For post-stay emails: days after check-out to send'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Whether this template is active'
    },
    includeLockPin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether to include lock PIN in this email'
    },
    availableVariables: {
      type: DataTypes.JSONB,
      defaultValue: {
        guest: ['guest_name', 'guest_email', 'guest_phone'],
        booking: ['check_in_date', 'check_out_date', 'nights', 'number_of_guests', 'total_amount', 'booking_id'],
        property: ['property_name', 'property_address', 'property_city', 'property_state', 'property_zip'],
        pin: ['lock_pin'],
        owner: ['owner_name', 'owner_phone', 'owner_email']
      },
      comment: 'Available template variables'
    }
  },
  {
    sequelize,
    modelName: 'EmailTemplate',
    tableName: 'email_templates',
    timestamps: true,
    indexes: [
      {
        fields: ['propertyId']
      },
      {
        fields: ['templateType']
      }
    ]
  }
)

module.exports = EmailTemplate
