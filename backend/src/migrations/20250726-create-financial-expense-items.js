'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('financial_expense_items', {
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
      month: { type: Sequelize.INTEGER, allowNull: false },
      expenseDate: { type: Sequelize.DATEONLY, allowNull: true },
      expenseName: { type: Sequelize.STRING(255), allowNull: true },
      vendor: { type: Sequelize.STRING(255), allowNull: true },
      amount: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
      tag: {
        type: Sequelize.STRING(50),
        defaultValue: 'other',
        comment: 'utilities, housekeeping, maintenance, hoa, other'
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    })

    await queryInterface.addIndex('financial_expense_items', ['propertyId', 'year', 'month'])
  },

  async down(queryInterface) {
    await queryInterface.dropTable('financial_expense_items')
  }
}
