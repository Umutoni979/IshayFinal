'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TABLE notifications
        ALTER COLUMN type TYPE VARCHAR(50);
    `);
  },

  async down(queryInterface, Sequelize) {
    // Re-create the original enum (only values that existed before)
    await queryInterface.sequelize.query(`
      ALTER TABLE notifications
        ALTER COLUMN type TYPE VARCHAR(50);
    `);
  },
};
