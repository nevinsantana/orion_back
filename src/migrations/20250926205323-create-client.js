'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('clients', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      tax_address: {
        type: Sequelize.STRING,
        allowNull: false
      },
      tax_regime: {
        type: Sequelize.STRING,
        allowNull: false
      },
      contact_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      contact_email: {
        type: Sequelize.STRING,
        allowNull: false
      },
      contact_phone: {
        type: Sequelize.STRING,
        allowNull: true // <--- Configurado como NULO
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      deleted_at: {
        type: Sequelize.DATE
      }
    }, {
      tableName: 'clients',
      timestamps: true,
      paranoid: true
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('clients');
  }
};