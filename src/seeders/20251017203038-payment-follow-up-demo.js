"use strict";
const { Op } = require("sequelize");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const today = new Date("2025-10-17T00:00:00Z");

    // --- 1. DATOS DE CLIENTES, FACTURAS Y PAGOS (Asumidos correctos) ---
    await queryInterface.bulkInsert(
      "clients",
      [
        {
          id: 1,
          name: "Cliente 1: Vencido",
          rfc: "C1V100101XYZ",
          contact_email: "juan@test.com",
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
          name: "Cliente 2: Por Vencer",
          rfc: "C2V200202ABC",
          contact_email: "ana@test.com",
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
          name: "Cliente 3: Pagado",
          rfc: "C3V300303DEF",
          contact_email: "luis@test.com",
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

    await queryInterface.bulkInsert(
      "invoices",
      [
        {
          id: 1,
          client_id: 1,
          total_amount: 15000.0,
          due_date: new Date("2025-10-16"),
          name: "Cliente 1: Vencido",
          rfc: "C1V100101XYZ",
          tax_address: "Addr C1",
          tax_regime: "601",
          uso_cfdi: "G03",
          regimen_fiscal_receptor: "601",
          domicilio_fiscal_receptor: "00001",
          metodo_pago: "PPD",
          created_at: today,
          updated_at: today,
          email_recepcion_facturas: "juan@test.com",
        },
        {
          id: 2,
          client_id: 2,
          total_amount: 20000.0,
          due_date: new Date("2025-10-18"),
          name: "Cliente 2: Por Vencer",
          rfc: "C2V200202ABC",
          tax_address: "Addr C2",
          tax_regime: "601",
          uso_cfdi: "G03",
          regimen_fiscal_receptor: "601",
          domicilio_fiscal_receptor: "00002",
          metodo_pago: "PPD",
          created_at: today,
          updated_at: today,
          email_recepcion_facturas: "ana@test.com",
        },
        {
          id: 3,
          client_id: 3,
          total_amount: 5000.0,
          due_date: new Date("2025-10-27"),
          name: "Cliente 3: Pendiente",
          rfc: "C3V300303DEF",
          tax_address: "Addr C3",
          tax_regime: "603",
          uso_cfdi: "G03",
          regimen_fiscal_receptor: "603",
          domicilio_fiscal_receptor: "00003",
          metodo_pago: "PUE",
          created_at: today,
          updated_at: today,
          email_recepcion_facturas: "luis@test.com",
        },
        {
          id: 4,
          client_id: 3,
          total_amount: 1000.0,
          due_date: new Date("2025-09-01"),
          name: "Cliente 3: Pagada",
          rfc: "C3V300303DEF",
          tax_address: "Addr C3",
          tax_regime: "603",
          uso_cfdi: "G03",
          regimen_fiscal_receptor: "603",
          domicilio_fiscal_receptor: "00003",
          metodo_pago: "PUE",
          created_at: today,
          updated_at: today,
          email_recepcion_facturas: "luis@test.com",
        },
      ],
      { ignoreDuplicates: true }
    );

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

    // --- 4. DATOS DE CÓDIGOS DE RECORDATORIO (reminder_codes) ---
    // ESTA VERSIÓN COINCIDE CON LA MIGRACIÓN DE LUIS (NO status, NO confirmed_by_user_id)
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
