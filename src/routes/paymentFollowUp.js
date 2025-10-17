const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.js"); // Asumimos el uso de tu middleware de autenticación

// Importamos las funciones del controlador que crearemos en el siguiente paso
const {
    getPaymentPortfolio,
    getSingleFollowUp
} = require("../controllers/paymentFollowUpController");

/**
 * Rutas para el Seguimiento y Notificaciones de Pagos
 * Prefijo: /api/paymentFollowUp
 */

// GET /api/paymentFollowUp/portfolio
// Obtiene la cartera completa de facturas con el estatus de seguimiento y saldo pendiente.
router.get("/portfolio", authMiddleware, getPaymentPortfolio);

// GET /api/paymentFollowUp/:id
// Obtiene el detalle de seguimiento de una factura específica.
router.get("/:id", authMiddleware, getSingleFollowUp);

module.exports = router;
