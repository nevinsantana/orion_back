// src/services/analyticsService.js

const { sequelize, Invoice, PaymentHistory, Client } = require('../models');

// Función modificada para aceptar clientId, startDate, y endDate
const getCollectionRateData = async (clientId = null, startDate = null, endDate = null) => { 
    try {
        const whereConditions = [];

        // 1. Condición por Cliente
        if (clientId) {
            whereConditions.push(`I.client_id = ${parseInt(clientId)}`);
        }

        // 2. Condición por Rango de Fechas (usa created_at como referencia de emisión)
        if (startDate) {
            // WHERE created_at >= '2024-01-01'
            whereConditions.push(`I.created_at >= '${startDate}'`); 
        }
        if (endDate) {
            // WHERE created_at <= '2024-03-31'
            whereConditions.push(`I.created_at <= '${endDate}'`);
        }

        // 3. Ensamblar la cláusula WHERE final
        const whereClause = whereConditions.length > 0
            ? `WHERE ${whereConditions.join(' AND ')}`
            : '';
            
        // Consulta avanzada: Usa la cláusula WHERE construida
        const result = await sequelize.query(`
            SELECT 
                DATE_FORMAT(I.created_at, '%Y-%m') AS month,
                COUNT(I.id) AS total_invoices,
                SUM(CASE 
                    WHEN PH.payment_date <= I.due_date THEN 1 
                    ELSE 0 
                END) AS paid_on_time,
                C.payment_category AS risk_category 
            FROM invoices AS I
            LEFT JOIN payment_history AS PH 
                ON I.id = PH.invoice_id
            JOIN clients AS C
                ON I.client_id = C.id
            ${whereClause}  -- ✅ Inyecta la cláusula WHERE dinámica
            GROUP BY month, risk_category
            ORDER BY month ASC;
        `, { type: sequelize.QueryTypes.SELECT });

        // ... (resto de la lógica de simulación de predicción) ...
        
        const totalInvoices = result.reduce((sum, r) => sum + r.total_invoices, 0);
        const paidOnTime = result.reduce((sum, r) => sum + r.paid_on_time, 0);

        return {
            historicalData: result,
            currentRate: (paidOnTime / totalInvoices) * 100 || 0,
            prediction: {
                nextMonth: Math.min(Math.max(Math.random() * 0.10 + 0.85, 0.80), 0.99) * 100,
                nextQuarter: (Math.min(Math.max(Math.random() * 0.10 + 0.85, 0.80), 0.99) + 0.02) * 100
            }
        };
    } catch (error) {
        console.error("Error en el servicio de analítica de cobranza:", error);
        throw new Error("Fallo al generar datos de TCE.");
    }
};

const getAverageCollectionDays = async (clientId = null, startDate = null, endDate = null) => {
    try {
        const whereConditions = [];

        // 1. Condición por Cliente (Si se proporciona)
        if (clientId) {
            whereConditions.push(`I.client_id = ${parseInt(clientId)}`);
        }

        // 2. Condición por Rango de Fechas (usa created_at de la factura)
        if (startDate) {
            whereConditions.push(`I.created_at >= '${startDate}'`); 
        }
        if (endDate) {
            whereConditions.push(`I.created_at <= '${endDate}'`);
        }
        
        // Excluir facturas no pagadas para calcular el DPC
        whereConditions.push(`PH.payment_date IS NOT NULL`); 

        // Ensamblar la cláusula WHERE final
        const whereClause = whereConditions.length > 0
            ? `WHERE ${whereConditions.join(' AND ')}`
            : '';
            
        // Consulta SQL: Calcula la diferencia de días
        const result = await sequelize.query(`
            SELECT 
                DATE_FORMAT(I.created_at, '%Y-%m') AS month,
                AVG(DATEDIFF(PH.payment_date, I.created_at)) AS average_days_to_collect,
                C.payment_category AS risk_category 
            FROM invoices AS I
            JOIN payment_history AS PH 
                ON I.id = PH.invoice_id
            JOIN clients AS C
                ON I.client_id = C.id
            ${whereClause}  -- Aplica todos los filtros dinámicamente
            GROUP BY month, risk_category
            ORDER BY month ASC;
        `, { type: sequelize.QueryTypes.SELECT });

        // ... (Cálculo de DPC Global y Simulación de Predicción) ...
        const totalDPC = result.reduce((sum, r) => sum + r.average_days_to_collect, 0);
        const globalDPC = result.length > 0 ? (totalDPC / result.length) : 0;
        
        const predictedDPC = globalDPC > 0 ? globalDPC * 1.05 : 35;

        return {
            historicalData: result,
            currentDPC: Math.round(globalDPC),
            prediction: {
                nextMonthDPC: Math.round(predictedDPC),
                nextQuarterDPC: Math.round(predictedDPC * 1.02)
            }
        };
    } catch (error) {
        console.error("Error en el servicio de analítica DPC:", error);
        throw new Error("Fallo al generar el reporte de DPC.");
    }
};

module.exports = { 
	getCollectionRateData,
	getAverageCollectionDays
 };