// src/controllers/analyticsController.js

const analyticsService = require('../services/analyticsService');

/**
 * GET /api/analytics/collection-rate
 * Obtiene la tasa de cobranza GLOBAL o por RANGO DE FECHAS.
 */
const getGlobalCollectionRate = async (req, res) => {
    try {
        // Extraer las fechas de la URL (req.query)
        const { startDate, endDate } = req.query; 

        // Pasar las fechas al servicio (clientId es null)
        const data = await analyticsService.getCollectionRateData(null, startDate, endDate); 

        res.status(200).json({
            code: 1,
            message: "Tasa de cobranza GLOBAL y predicción generadas.",
            data: data
        });
    } catch (error) {
        res.status(500).json({ code: 0, error: error.message });
    }
};

/**
 * GET /api/analytics/client-rate/:clientId
 * Obtiene la tasa de cobranza para un CLIENTE ESPECÍFICO por RANGO DE FECHAS.
 */
const getClientCollectionRate = async (req, res) => {
    try {
        const { clientId } = req.params;
        // ✅ Extraer las fechas de la URL (req.query)
        const { startDate, endDate } = req.query; 

        if (!clientId) {
             return res.status(400).json({ code: 0, error: "Se requiere el ID del cliente." });
        }

        // Llama al servicio pasando el ID y las fechas
        const data = await analyticsService.getCollectionRateData(clientId, startDate, endDate); 

        res.status(200).json({
            code: 1,
            message: `Tasa de cobranza para Cliente ID ${clientId} y predicción generadas.`,
            data: data
        });
    } catch (error) {
        res.status(500).json({ code: 0, error: error.message });
    }
};

const getDPCReport = async (req, res) => {
    try {
        // ✅ Extrae TODOS los posibles filtros de los parámetros de consulta
        const { clientId, startDate, endDate } = req.query; 

        // Pasa todos los filtros al servicio
        const data = await analyticsService.getAverageCollectionDays(clientId, startDate, endDate); 

        res.status(200).json({
            code: 1,
            message: "Reporte de Días Promedio de Cobro (DPC) generado.",
            data: data
        });
    } catch (error) {
        console.error("Error en el controlador DPC:", error);
        res.status(500).json({ code: 0, error: error.message || "Fallo interno al generar el reporte DPC." });
    }
};

module.exports = { 
	getGlobalCollectionRate, 
	getClientCollectionRate,
	getDPCReport
};