// src/routes/invoices.js
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.js");
const { 
  getInvoices, 
  getInvoice, // <-- Función de obtención por ID
  postInvoice, 
  updateInvoice, 
  destroyInvoice,
  restoreInvoice, // <-- Función de restauración
  getDeletedInvoices,
  getCodesByInvoice,
  updatePaymentStatus,
  getAllReminderCodes,
  getReminderCodeById,
  generateInvoiceTxt
} = require("../controllers/invoicesController");

const { 
  timbrar
} = require("../controllers/timbradoController");

// Rutas Protegidas de CRUD
router.get("/", authMiddleware, getInvoices);
router.get("/deleted", authMiddleware, getDeletedInvoices);
router.get("/get_payment_invoice/:id", authMiddleware, getCodesByInvoice);
router.get("/getAllReminderCodes", authMiddleware, getAllReminderCodes);
router.get("/getReminderCodeById/:id", authMiddleware, getReminderCodeById );
router.get("/generate-txt/:id", generateInvoiceTxt);


// Rutas con ID
router.get("/:id", authMiddleware, getInvoice);
router.put("/:id", authMiddleware, updateInvoice);
router.delete("/:id", authMiddleware, destroyInvoice);

// Ruta de Restauración
router.post("/restore/:id", authMiddleware, restoreInvoice);
router.post("/", authMiddleware, postInvoice);
router.post("/update-status", authMiddleware, updatePaymentStatus);
router.post("/timbrar", timbrar);

module.exports = router;