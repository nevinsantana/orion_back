'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('reminder_codes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER.UNSIGNED // Usar UNSIGNED para IDs
      },
      id_invoice: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        // (Omitimos 'references' para no forzar la unión a nivel de DB)
      },
      code: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      used: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      image: {
        type: Sequelize.STRING(500),
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
      tableName: 'reminder_codes',
      timestamps: true,
      paranoid: true
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('reminder_codes');
  }
};