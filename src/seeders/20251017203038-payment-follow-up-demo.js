'use strict';
const { Op } = require('sequelize');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const today = new Date('2025-10-17T00:00:00Z');

    // --- 1. LIMPIEZA CONDICIONAL (SOLO EN AMBIENTE LOCAL) ---
    if (process.env.NODE_ENV === 'local') {
      console.log('Ambiente local detectado. Limpiando tablas de pagos y facturas para seeding...');
      // Hay que eliminar en orden inverso a la dependencia de FK
      await queryInterface.bulkDelete('payment_history', null, {});
      await queryInterface.bulkDelete('invoices', null, {});
      await queryInterface.bulkDelete('clients', null, {});
    }
    
    // --- 2. INSERCIÓN DE DATOS ---
    // NOTA: Los IDs son forzados a 1, 2, 3 para que las FK de Invoices funcionen
    await queryInterface.bulkInsert('clients', [
      { id: 1, name: 'Cliente 1: Vencido', rfc: 'C1V100101XYZ', contact_email: 'juan@test.com', tax_address: 'Addr C1', tax_regime: '601', uso_cfdi: 'G03', regimen_fiscal_receptor: '601', domicilio_fiscal_receptor: '00001', metodo_pago: 'PPD', created_at: today, updated_at: today, contact_name: 'Juan Demo' },
      { id: 2, name: 'Cliente 2: Por Vencer', rfc: 'C2V200202ABC', contact_email: 'ana@test.com', tax_address: 'Addr C2', tax_regime: '601', uso_cfdi: 'G03', regimen_fiscal_receptor: '601', domicilio_fiscal_receptor: '00002', metodo_pago: 'PPD', created_at: today, updated_at: today, contact_name: 'Ana Demo' },
      { id: 3, name: 'Cliente 3: Pagado', rfc: 'C3V300303DEF', contact_email: 'luis@test.com', tax_address: 'Addr C3', tax_regime: '603', uso_cfdi: 'G03', regimen_fiscal_receptor: '603', domicilio_fiscal_receptor: '00003', metodo_pago: 'PUE', created_at: today, updated_at: today, contact_name: 'Luis Demo' },
    ], {});

    await queryInterface.bulkInsert('invoices', [
      // Factura 1: Vencida (Venció ayer) - Saldo 15000.00
      { id: 1, client_id: 1, total_amount: 15000.00, due_date: new Date('2025-10-16'), name: 'Cliente 1: Vencido', rfc: 'C1V100101XYZ', tax_address: 'Addr C1', tax_regime: '601', uso_cfdi: 'G03', regimen_fiscal_receptor: '601', domicilio_fiscal_receptor: '00001', metodo_pago: 'PPD', created_at: today, updated_at: today, email_recepcion_facturas: 'juan@test.com' },
      // Factura 2: Por Vencer (Vence mañana) - Pago parcial, Saldo 10000.00
      { id: 2, client_id: 2, total_amount: 20000.00, due_date: new Date('2025-10-18'), name: 'Cliente 2: Por Vencer', rfc: 'C2V200202ABC', tax_address: 'Addr C2', tax_regime: '601', uso_cfdi: 'G03', regimen_fiscal_receptor: '601', domicilio_fiscal_receptor: '00002', metodo_pago: 'PPD', created_at: today, updated_at: today, email_recepcion_facturas: 'ana@test.com' },
      // Factura 3: Pendiente (Vence en 10 días) - Saldo 5000.00
      { id: 3, client_id: 3, total_amount: 5000.00, due_date: new Date('2025-10-27'), name: 'Cliente 3: Pendiente', rfc: 'C3V300303DEF', tax_address: 'Addr C3', tax_regime: '603', uso_cfdi: 'G03', regimen_fiscal_receptor: '603', domicilio_fiscal_receptor: '00003', metodo_pago: 'PUE', created_at: today, updated_at: today, email_recepcion_facturas: 'luis@test.com' },
      // Factura 4: Pagada (Para probar estatus Pagada) - Saldo 0.00
      { id: 4, client_id: 3, total_amount: 1000.00, due_date: new Date('2025-09-01'), name: 'Cliente 3: Pagada', rfc: 'C3V300303DEF', tax_address: 'Addr C3', tax_regime: '603', uso_cfdi: 'G03', regimen_fiscal_receptor: '603', domicilio_fiscal_receptor: '00003', metodo_pago: 'PUE', created_at: today, updated_at: today, email_recepcion_facturas: 'luis@test.com' },
    ], {});

    await queryInterface.bulkInsert('payment_history', [
      // Pago para Factura 2: Parcial (10000)
      { invoice_id: 2, payment_date: new Date('2025-10-05'), amount: 10000.00, payment_method: 'Transferencia', description: 'Primer abono a factura', created_at: today, updated_at: today },
      // Pago para Factura 4: Completo (1000)
      { invoice_id: 4, payment_date: new Date('2025-09-02'), amount: 1000.00, payment_method: 'Transferencia', description: 'Pago total', created_at: today, updated_at: today },
    ], {});
  },

  async down(queryInterface, Sequelize) {
    // La función 'down' no necesita el chequeo de NODE_ENV,
    // ya que solo se ejecuta cuando explícitamente se hace un revert.
    await queryInterface.bulkDelete('payment_history', {
      invoice_id: { [Op.in]: [2, 4] }
    }, {});
    await queryInterface.bulkDelete('invoices', {
      id: { [Op.in]: [1, 2, 3, 4] }
    }, {});
    await queryInterface.bulkDelete('clients', {
      id: { [Op.in]: [1, 2, 3] }
    }, {});
  }
};
