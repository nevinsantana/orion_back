'use strict';
// Importamos bcryptjs para hashear la contraseña
const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Definimos el hash de la contraseña 'abc123'. 
    // Usamos un salt de 10, que es un estándar seguro.
    const hashedPassword = await bcrypt.hash('abc123', 10);
    const date = new Date();

    await queryInterface.bulkInsert('users', [{
      first_name: 'Nevin',
      last_name: 'Santana (Admin)',
      email: 'nevsantana@fabricadesoluciones.com',
      password: hashedPassword,
      created_at: date,
      updated_at: date
    }], {});
  },

  async down(queryInterface, Sequelize) {
    // Comando para eliminar el usuario insertado al revertir el seeder
    await queryInterface.bulkDelete('users', {
      email: 'nevsantana@fabricadesoluciones.com'
    }, {});
  }
};