const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.js");


const { generateResponse, analyzePdfRoute, pdfUploadMiddleware } = require("../controllers/aiController"); // <-- Importamos el middleware


router.post(
    "/analyze-pdf", 
    authMiddleware,     
    pdfUploadMiddleware,
    analyzePdfRoute     
);

module.exports = router;