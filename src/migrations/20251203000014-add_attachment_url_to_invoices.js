'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('invoices', 'file', {
      type: Sequelize.STRING(500), // STRING is appropriate for storing a long URL or file path
      allowNull: true, // It must be nullable since the attachment is optional
    });
  },

  async down(queryInterface, Sequelize) {
    // If you revert the migration, this command removes the column
    await queryInterface.removeColumn('invoices', 'file');
  }
};