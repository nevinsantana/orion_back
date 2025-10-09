const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.js");

// Importa las funciones del controlador con los nombres actualizados
const {
  getPaymentHistory,
  getSinglePaymentHistory,
  postPaymentHistory,
  updatePaymentHistory,
  destroyPaymentHistory,
  getDeletedPaymentHistory,
  restorePaymentHistory
} = require("../controllers/paymentHistoryController");

// Rutas para el CRUD de Historial de Pagos
router.get("/", authMiddleware, getPaymentHistory);
router.get("/deleted", authMiddleware, getDeletedPaymentHistory);
router.get("/:id", authMiddleware, getSinglePaymentHistory);
router.post("/", authMiddleware, postPaymentHistory);
router.put("/:id", authMiddleware, updatePaymentHistory);
router.delete("/:id", authMiddleware, destroyPaymentHistory);
router.post("/restore/:id", authMiddleware, restorePaymentHistory);

module.exports = router;