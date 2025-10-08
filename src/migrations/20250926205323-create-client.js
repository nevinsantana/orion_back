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
        allowNull: true
      },
      contact_email: {
        type: Sequelize.STRING,
        allowNull: true
      },
      contact_phone: {
        type: Sequelize.STRING,
        allowNull: true // <--- Configurado como NULO
      },
      uso_cfdi: {
        type: Sequelize.STRING,
        allowNull: false
      },
      regimen_fiscal_receptor: {
        type: Sequelize.STRING,
        allowNull: false
      },
      domicilio_fiscal_receptor: {
        type: Sequelize.STRING,
        allowNull: false
      },
      metodo_pago: {
        type: Sequelize.STRING,
        allowNull: false
      },
      forma_pago: {
        type: Sequelize.STRING,
        allowNull: true
      },
      email_recepcion_facturas: {
        type: Sequelize.STRING,
        allowNull: true
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