const express = require("express");
const router = express.Router();

// Importamos solo el controlador y el middleware de Multer.
// NO importamos authMiddleware.
const { 
    validateCodeAndImage, 
    imageUploadMiddleware,
    getCodesByInvoice
} = require("../controllers/invoicesController"); // <-- Asumo que el controlador se llama así

// Ruta PÚBLICA para la validación: POST /api/reminders/validate
// Primero, aplica el middleware de subida de imagen, luego el controlador.
router.post("/validate", imageUploadMiddleware, validateCodeAndImage);


module.exports = router;