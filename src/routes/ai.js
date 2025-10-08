// src/routes/ai.js

const express = require("express");
const router = express.Router();
const { generateResponse, analyzePdfRoute } = require("../controllers/aiController");

// Importar Multer (asumimos que lo definiste en aiController para este ejemplo)
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// Ruta para la generación de texto simple (existente)
router.post("/", generateResponse);

// NUEVA RUTA PARA EL ANÁLISIS DE PDF
// upload.single('pdfFile') es el middleware que procesa el archivo
// 'pdfFile' debe coincidir con el nombre del campo en el formulario/Postman
router.post("/analyze-pdf", upload.single('pdfFile'), analyzePdfRoute);

module.exports = router;