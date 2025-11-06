// src/routes/analytics.js

const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.js");
const { 
    getGlobalCollectionRate, 
    getClientCollectionRate, 
    getDPCReport // Importar la función DPC
} = require("../controllers/analyticsController");

// -----------------------------------------------------------------
// Rutas Protegidas (Requieren Bearer Token)
// -----------------------------------------------------------------

// TCE Global (ej: /collection-rate?startDate=...)
router.get("/collection-rate", getGlobalCollectionRate);

// TCE por Cliente (ej: /client-rate/5?startDate=...)
router.get("/client-rate/:clientId", getClientCollectionRate);

// ✅ DPC Reporte (Filtros combinados opcionales)
// Endpoint: /average-collection-days?clientId=X&startDate=Y&endDate=Z
router.get("/average-collection-days", getDPCReport); 

module.exports = router;