'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('financial_monthly', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true
      },
      propertyId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'properties', key: 'id' },
        onDelete: 'CASCADE'
      },
      year: { type: Sequelize.INTEGER, allowNull: false },
      month: { type: Sequelize.INTEGER, allowNull: false }, // 1–12
      grossIncome: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 },
      managementFee: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 },
      // Vermont itemized expense columns
      cleaningFee: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 },
      utilities: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 },
      maintenance: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 },
      otherExpenses: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 },
      // Myrtle Beach catch-all charges column
      platformCharges: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 },
      // Booking metrics
      nightsBooked: { type: Sequelize.INTEGER, defaultValue: 0 },
      numReservations: { type: Sequelize.INTEGER, defaultValue: 0 },
      // Monthly costs
      hoaPayment: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 },
      actualMortgagePaid: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 },
      // Sync tracking
      syncSource: {
        type: Sequelize.STRING(20),
        defaultValue: 'manual',
        comment: 'manual or auto'
      },
      lastSyncedAt: { type: Sequelize.DATE, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    })

    await queryInterface.addConstraint('financial_monthly', {
      fields: ['propertyId', 'year', 'month'],
      type: 'unique',
      name: 'unique_property_year_month'
    })

    await queryInterface.addIndex('financial_monthly', ['propertyId', 'year'])
  },

  async down(queryInterface) {
    await queryInterface.dropTable('financial_monthly')
  }
}
