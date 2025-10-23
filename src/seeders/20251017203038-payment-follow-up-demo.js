"use strict";
const { Op } = require("sequelize");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const today = new Date("2025-10-17T00:00:00Z");

    // --- 1. DATOS DE CLIENTES ---
    // ASIGNAMOS TUS CORREOS DE PRUEBA A LOS CLIENTES
    await queryInterface.bulkInsert(
      "clients",
      [
        {
          id: 1,
          name: "Cliente 1: Vencido (Nevin)",
          rfc: "C1V100101XYZ",
          contact_email: "nevsantana@fabricadesoluciones.com",
          tax_address: "Addr C1",
          tax_regime: "601",
          uso_cfdi: "G03",
          regimen_fiscal_receptor: "601",
          domicilio_fiscal_receptor: "00001",
          metodo_pago: "PPD",
          created_at: today,
          updated_at: today,
          contact_name: "Juan Demo",
        },
        {
          id: 2,
          name: "Cliente 2: Por Vencer (Gmail)",
          rfc: "C2V200202ABC",
          contact_email: "roll.9330@gmail.com",
          tax_address: "Addr C2",
          tax_regime: "601",
          uso_cfdi: "G03",
          regimen_fiscal_receptor: "601",
          domicilio_fiscal_receptor: "00002",
          metodo_pago: "PPD",
          created_at: today,
          updated_at: today,
          contact_name: "Ana Demo",
        },
        {
          id: 3,
          name: "Cliente 3: Pagado (Hotmail)",
          rfc: "C3V300303DEF",
          contact_email: "roll.93@hotmail.com",
          tax_address: "Addr C3",
          tax_regime: "603",
          uso_cfdi: "G03",
          regimen_fiscal_receptor: "603",
          domicilio_fiscal_receptor: "00003",
          metodo_pago: "PUE",
          created_at: today,
          updated_at: today,
          contact_name: "Luis Demo",
        },
      ],
      { ignoreDuplicates: true }
    );

    // --- 2. DATOS DE FACTURAS ---
    await queryInterface.bulkInsert(
      "invoices",
      [
        // Factura 1 (Vencida) -> Va a Nevin (Urgente)
        {
          id: 1,
          client_id: 1,
          total_amount: 15000.0,
          due_date: new Date("2025-10-16"),
          name: "Factura Vencida",
          rfc: "C1V100101XYZ",
          tax_address: "Addr C1",
          tax_regime: "601",
          uso_cfdi: "G03",
          regimen_fiscal_receptor: "601",
          domicilio_fiscal_receptor: "00001",
          metodo_pago: "PPD",
          created_at: today,
          updated_at: today,
          email_recepcion_facturas: "nevsantana@fabricadesoluciones.com",
        },
        // Factura 2 (Por Vencer) -> Va a Gmail (Aviso)
        {
          id: 2,
          client_id: 2,
          total_amount: 20000.0,
          due_date: new Date("2025-10-18"),
          name: "Factura Por Vencer",
          rfc: "C2V200202ABC",
          tax_address: "Addr C2",
          tax_regime: "601",
          uso_cfdi: "G03",
          regimen_fiscal_receptor: "601",
          domicilio_fiscal_receptor: "00002",
          metodo_pago: "PPD",
          created_at: today,
          updated_at: today,
          email_recepcion_facturas: "roll.9330@gmail.com",
        },
        // Factura 3 (Pendiente, vence en 10 días) -> Va a Hotmail (No se envía, solo para verificar el filtro)
        {
          id: 3,
          client_id: 3,
          total_amount: 5000.0,
          due_date: new Date("2025-10-27"),
          name: "Factura Pendiente",
          rfc: "C3V300303DEF",
          tax_address: "Addr C3",
          tax_regime: "603",
          uso_cfdi: "G03",
          regimen_fiscal_receptor: "603",
          domicilio_fiscal_receptor: "00003",
          metodo_pago: "PUE",
          created_at: today,
          updated_at: today,
          email_recepcion_facturas: "roll.93@hotmail.com",
        },
        // Factura 4 (Pagada) -> Va a Hotmail (No se envía)
        {
          id: 4,
          client_id: 3,
          total_amount: 1000.0,
          due_date: new Date("2025-09-01"),
          name: "Factura Pagada",
          rfc: "C3V300303DEF",
          tax_address: "Addr C3",
          tax_regime: "603",
          uso_cfdi: "G03",
          regimen_fiscal_receptor: "603",
          domicilio_fiscal_receptor: "00003",
          metodo_pago: "PUE",
          created_at: today,
          updated_at: today,
          email_recepcion_facturas: "roll.93@hotmail.com",
        },
      ],
      { ignoreDuplicates: true }
    );

    // --- 3. DATOS DE PAGOS (Se mantienen igual) ---
    await queryInterface.bulkInsert(
      "payment_history",
      [
        {
          invoice_id: 2,
          payment_date: new Date("2025-10-05"),
          amount: 10000.0,
          payment_method: "Transferencia",
          description: "Primer abono a factura",
          created_at: today,
          updated_at: today,
        },
        {
          invoice_id: 4,
          payment_date: new Date("2025-09-02"),
          amount: 1000.0,
          payment_method: "Transferencia",
          description: "Pago total",
          created_at: today,
          updated_at: today,
        },
      ],
      { ignoreDuplicates: true }
    );

    // --- 4. CÓDIGOS DE RECORDATORIO (Se mantienen para simulación de reutilización) ---
    await queryInterface.bulkInsert(
      "reminder_codes",
      [
        {
          id_invoice: 1,
          code: "VENCIDA-1",
          used: 0,
          created_at: today,
          updated_at: today,
        },
        {
          id_invoice: 2,
          code: "PORVENCER-2",
          used: 0,
          created_at: today,
          updated_at: today,
        },
        {
          id_invoice: 3,
          code: "PENDIENTE-3",
          used: 0,
          created_at: today,
          updated_at: today,
        },
        {
          id_invoice: 4,
          code: "PAGADA-4",
          used: 1,
          created_at: today,
          updated_at: today,
        },
      ],
      { ignoreDuplicates: true }
    );
  },

  async down(queryInterface, Sequelize) {
    // Revertir la inserción de datos en el orden inverso
    await queryInterface.bulkDelete("reminder_codes", null, {});
    await queryInterface.bulkDelete("payment_history", null, {});
    await queryInterface.bulkDelete("invoices", null, {});
    await queryInterface.bulkDelete("clients", null, {});
  },
};
