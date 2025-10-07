// src/routes/ai.js

const express = require("express");
const router = express.Router();
const { generateResponse } = require("../controllers/aiController");

// La ruta raíz de este router será /api/ai
router.post("/", generateResponse);

module.exports = router;