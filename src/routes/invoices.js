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
  getCodesByInvoice
} = require("../controllers/invoicesController");

// Rutas Protegidas de CRUD
router.get("/", authMiddleware, getInvoices);
router.get("/deleted", authMiddleware, getDeletedInvoices);
router.get("/get_payment_invoice/:id", authMiddleware, getCodesByInvoice);
 

// Rutas con ID
router.get("/:id", authMiddleware, getInvoice);
router.put("/:id", authMiddleware, updateInvoice);
router.delete("/:id", authMiddleware, destroyInvoice);

// Ruta de Restauración
router.post("/restore/:id", authMiddleware, restoreInvoice);
router.post("/", authMiddleware, postInvoice);

module.exports = router;