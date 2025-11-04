const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.js");

const {
    getInvoicesReportData,
    generateAndUploadXLS,
    listRepositoryInvoices
} = require("../controllers/invoiceReportsController");

/**
 * Rutas para el Reporte de Estado de Facturas
 * Prefijo: /api/invoiceReports
 */

// 1. GET /api/invoiceReports/data
// Obtiene el listado de facturas con filtros y estatus (la fuente de datos del reporte).
router.get("/data", authMiddleware, getInvoicesReportData);

// 2. POST /api/invoiceReports/xls
// Genera el archivo XLS, lo sube a S3 (simulación) y usa IA.
router.post("/xls", authMiddleware, generateAndUploadXLS);

// 3. GET /api/invoiceReports/repo
// Lista los archivos XLS generados en el repositorio (simulación).
router.get("/repo", authMiddleware, listRepositoryInvoices);

module.exports = router;
