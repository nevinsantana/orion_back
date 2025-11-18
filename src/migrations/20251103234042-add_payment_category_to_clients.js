'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('clients', 'payment_category', {
      type: Sequelize.ENUM('Alto Riesgo', 'Riesgo Medio', 'Bajo Riesgo', 'Siempre a Tiempo'),
      allowNull: false,
      defaultValue: 'Bajo Riesgo', // Valor inicial antes de que la IA lo clasifique
      comment: 'Clasificación del cliente basada en su historial de pagos para el modelo de IA.',
    });
  },
  
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('clients', 'payment_category');
  }
};