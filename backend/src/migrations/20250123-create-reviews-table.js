'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('reviews', {
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
      bookingId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'bookings',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      guestId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'guests',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      guestName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      guestEmail: {
        type: Sequelize.STRING,
        allowNull: true
      },
      rating: {
        type: Sequelize.DECIMAL(2, 1),
        allowNull: false
      },
      cleanliness: {
        type: Sequelize.DECIMAL(2, 1),
        allowNull: true
      },
      communication: {
        type: Sequelize.DECIMAL(2, 1),
        allowNull: true
      },
      checkIn: {
        type: Sequelize.DECIMAL(2, 1),
        allowNull: true
      },
      accuracy: {
        type: Sequelize.DECIMAL(2, 1),
        allowNull: true
      },
      location: {
        type: Sequelize.DECIMAL(2, 1),
        allowNull: true
      },
      value: {
        type: Sequelize.DECIMAL(2, 1),
        allowNull: true
      },
      title: {
        type: Sequelize.STRING,
        allowNull: true
      },
      comment: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      platform: {
        type: Sequelize.ENUM('direct', 'airbnb', 'vrbo', 'booking_com', 'other'),
        defaultValue: 'direct'
      },
      externalReviewId: {
        type: Sequelize.STRING,
        allowNull: true
      },
      checkInDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      checkOutDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      isVerified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      isPublished: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      ownerResponse: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      ownerResponseDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      isHelpful: {
        type: Sequelize.INTEGER,
        defaultValue: 0
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
    await queryInterface.addIndex('reviews', ['propertyId']);
    await queryInterface.addIndex('reviews', ['bookingId']);
    await queryInterface.addIndex('reviews', ['guestId']);
    await queryInterface.addIndex('reviews', ['platform']);
    await queryInterface.addIndex('reviews', ['rating']);
    await queryInterface.addIndex('reviews', ['createdAt']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('reviews');
  }
};
