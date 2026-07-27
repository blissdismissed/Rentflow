'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('financial_booking_transactions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      propertyId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'properties', key: 'id' },
        onDelete: 'CASCADE',
      },
      externalBookingId: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      bookingSource: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      year: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      month: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      grossAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      nightsBooked: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      checkInDate: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      checkOutDate: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      guestName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      status: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    })

    // Unique per property+booking so re-importing the same CSV never duplicates
    await queryInterface.addIndex('financial_booking_transactions', ['propertyId', 'externalBookingId'], {
      unique: true,
      name: 'fbt_property_external_booking_unique',
    })

    await queryInterface.addIndex('financial_booking_transactions', ['propertyId', 'year', 'month'])
  },

  async down(queryInterface) {
    await queryInterface.dropTable('financial_booking_transactions')
  },
}
