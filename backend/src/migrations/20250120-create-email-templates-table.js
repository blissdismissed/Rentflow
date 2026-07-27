'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('email_templates', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      propertyId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'properties',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      templateType: {
        type: Sequelize.ENUM('pre_stay', 'post_stay', 'booking_confirmation', 'custom'),
        allowNull: false,
        defaultValue: 'pre_stay'
      },
      subject: {
        type: Sequelize.STRING,
        allowNull: false
      },
      htmlContent: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      plainTextContent: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      daysBeforeCheckIn: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      daysAfterCheckOut: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      includeLockPin: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      availableVariables: {
        type: Sequelize.JSONB,
        defaultValue: {
          guest: ['guest_name', 'guest_email', 'guest_phone'],
          booking: ['check_in_date', 'check_out_date', 'nights', 'number_of_guests', 'total_amount', 'booking_id'],
          property: ['property_name', 'property_address', 'property_city', 'property_state', 'property_zip'],
          pin: ['lock_pin'],
          owner: ['owner_name', 'owner_phone', 'owner_email']
        }
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Add indexes
    await queryInterface.addIndex('email_templates', ['propertyId']);
    await queryInterface.addIndex('email_templates', ['templateType']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('email_templates');
  }
};
