'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('invoices', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER.UNSIGNED
      },
      // --- NUEVOS CAMPOS DE RELACIÓN Y SEGUIMIENTO ---
      client_id: { // Llave Foránea a la tabla 'clients'
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'clients',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      total_amount: { // Campo: Monto total de la factura (necesario para calcular saldo)
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      due_date: { // Campo: Fecha de vencimiento (necesario para el seguimiento)
        type: Sequelize.DATE,
        allowNull: false
      },
      
      // --- CAMPOS REDUNDANTES/SNAPSHOTS (Se mantienen por el CFDI) ---
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      rfc: {
        type: Sequelize.STRING,
        allowNull: false
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
        allowNull: true
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
      
      // --- CAMPOS DE CONTROL ---
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
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('invoices');
  }
};