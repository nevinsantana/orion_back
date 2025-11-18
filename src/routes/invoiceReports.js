const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.js");

const {
    getInvoicesReportData,
    generateAndUploadXLS,
    listRepositoryInvoices,
    getAgingReport, // Función para GET /aging
    generateAgingXLS, // Función para POST /aging/xls
    listAgingRepository
} = require("../controllers/invoiceReportsController");

/**
 * Rutas para el Reporte de Estado de Facturas
 * Prefijo: /api/invoiceReports
 */

// 1. GET /api/invoiceReports/data (Fuente de datos del Reporte de Estado)
router.get("/data", authMiddleware, getInvoicesReportData);

// 2. POST /api/invoiceReports/xls (Genera XLS de Estado)
router.post("/xls", authMiddleware, generateAndUploadXLS);

// 3. GET /api/invoiceReports/repo (Listado general de reportes S3)
router.get("/repo", authMiddleware, listRepositoryInvoices);

// 4. GET /api/invoiceReports/aging (Datos crudos de Antigüedad)
router.get("/aging", authMiddleware, getAgingReport);

// 5. POST /api/invoiceReports/aging/xls  <--- ¡ESTA ES LA RUTA FALTANTE Y CORREGIDA!
// Genera el archivo XLS del reporte de Antigüedad.
router.post("/aging/xls", authMiddleware, generateAgingXLS); 

module.exports = router;