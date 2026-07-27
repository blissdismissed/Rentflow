'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add 'cleaner' to the role enum
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_users_role" ADD VALUE IF NOT EXISTS 'cleaner';
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Note: PostgreSQL doesn't support removing enum values easily
    // This would require recreating the enum and the column
    console.log('Warning: Removing enum values is not supported. Manual intervention may be required.');
  }
};
