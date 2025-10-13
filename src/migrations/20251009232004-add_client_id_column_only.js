'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('invoices', 'client_id', {
      type: Sequelize.INTEGER.UNSIGNED, // Tipo correcto para un ID
      allowNull: true, // Permitimos NULL
      // *** CLAVE: NO SE INCLUYE EL BLOQUE 'references' ***
    });
  },

  async down(queryInterface, Sequelize) {
    // Revertir: elimina solo la columna
    await queryInterface.removeColumn('invoices', 'client_id');
  },
};