'use strict';
const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // --- 1. LIMPIEZA CONDICIONAL (SOLO EN AMBIENTE LOCAL) ---
    if (process.env.NODE_ENV === 'local') {
      console.log('Ambiente local detectado. Limpiando tabla de usuarios para seeding...');
      // Eliminamos todos los usuarios para evitar errores de unicidad
      await queryInterface.bulkDelete('users', null, {});
    }

    // Definimos el hash de la contraseña 'abc123'
    const hashedPassword = await bcrypt.hash('abc123', 10);
    const date = new Date();

    // --- 2. INSERCIÓN DE DATOS ---
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
    // Eliminamos el usuario al hacer revert
    await queryInterface.bulkDelete('users', {
      email: 'nevsantana@fabricadesoluciones.com'
    }, {});
  }
};
