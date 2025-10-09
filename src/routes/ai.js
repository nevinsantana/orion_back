// src/routes/ai.js

const express = require("express");
const router = express.Router();
const { generateResponse, analyzePdfRoute, pdfUploadMiddleware } = require("../controllers/aiController"); // <-- Importamos el middleware

// ELIMINA ESTAS LÍNEAS QUE CAUSAN EL CONFLICTO:
// const multer = require('multer'); 
// const upload = multer({ dest: 'uploads/' }); // ESTO USA DISKSTORAGE POR DEFECTO

// La ruta de texto simple es correcta.
//router.post("/", generateResponse);

// NUEVA RUTA PARA EL ANÁLISIS DE PDF
// Usamos el middleware que EXPORTAMOS de aiController, el cual TIENE memoryStorage
router.post("/analyze-pdf", pdfUploadMiddleware, analyzePdfRoute); // <--- USAR pdfUploadMiddleware

module.exports = router;