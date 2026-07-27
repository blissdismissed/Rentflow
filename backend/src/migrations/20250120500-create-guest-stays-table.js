'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('guest_stays', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      guestId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'guests',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
      bookingId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'bookings',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      checkIn: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      checkOut: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      nights: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      numberOfGuests: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      totalAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      rating: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      review: {
        type: Sequelize.TEXT,
        allowNull: true
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
    await queryInterface.addIndex('guest_stays', ['guestId']);
    await queryInterface.addIndex('guest_stays', ['propertyId']);
    await queryInterface.addIndex('guest_stays', ['bookingId']);
    await queryInterface.addIndex('guest_stays', ['checkIn', 'checkOut']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('guest_stays');
  }
};
