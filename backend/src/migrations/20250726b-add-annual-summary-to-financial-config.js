'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const cols = [
      ['grossIncomeAnnual',    { type: Sequelize.DECIMAL(12, 2), allowNull: true }],
      ['managementFeeAnnual',  { type: Sequelize.DECIMAL(12, 2), allowNull: true }],
      ['platformChargesAnnual',{ type: Sequelize.DECIMAL(12, 2), allowNull: true }],
      ['cleaningFeeAnnual',    { type: Sequelize.DECIMAL(12, 2), allowNull: true }],
      ['utilitiesAnnual',      { type: Sequelize.DECIMAL(12, 2), allowNull: true }],
      ['maintenanceAnnual',    { type: Sequelize.DECIMAL(12, 2), allowNull: true }],
      ['otherExpensesAnnual',  { type: Sequelize.DECIMAL(12, 2), allowNull: true }],
      ['nightsBookedAnnual',   { type: Sequelize.INTEGER, allowNull: true }],
      ['numReservationsAnnual',{ type: Sequelize.INTEGER, allowNull: true }],
      ['hoaAnnual',            { type: Sequelize.DECIMAL(12, 2), allowNull: true }],
      ['actualMortgageAnnual', { type: Sequelize.DECIMAL(12, 2), allowNull: true }],
    ]
    for (const [col, def] of cols) {
      await queryInterface.addColumn('financial_annual_config', col, def)
    }
  },

  down: async (queryInterface) => {
    const cols = [
      'grossIncomeAnnual','managementFeeAnnual','platformChargesAnnual',
      'cleaningFeeAnnual','utilitiesAnnual','maintenanceAnnual','otherExpensesAnnual',
      'nightsBookedAnnual','numReservationsAnnual','hoaAnnual','actualMortgageAnnual',
    ]
    for (const col of cols) {
      await queryInterface.removeColumn('financial_annual_config', col)
    }
  }
}
