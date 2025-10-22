'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('reminder_codes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER.UNSIGNED
      },
      id_invoice: { // Columna de Luis
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        unique: true, // CLAVE: Solo un código de recordatorio activo por factura
        references: { // CRUCIAL: Llave foránea para la integridad
          model: 'invoices', // Nombre de la tabla de facturas
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      code: {
        type: Sequelize.STRING(32), // Tamaño optimizado para tokens/UUID
        allowNull: false,
        unique: true
      },
      used: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      image: { // Mantenemos el nombre 'image'
        type: Sequelize.STRING(500),
        allowNull: true
      },
      status: { // Nuevo campo para el flujo de confirmación de pago
        type: Sequelize.ENUM('PENDING', 'CONFIRMED', 'REJECTED'),
        defaultValue: 'PENDING',
        allowNull: false
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
      tableName: 'reminder_codes',
      timestamps: true,
      paranoid: true
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('reminder_codes');
  }
};