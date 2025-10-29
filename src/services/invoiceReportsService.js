const ExcelJS = require('exceljs');
const AWS = require('aws-sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const paymentFollowUpService = require('./paymentFollowUpService');
const fs = require('fs');
const path = require('path');

// --- Inicialización Global de Dependencias (Asumimos que están en el ámbito global del servicio) ---
// NOTA: Estas variables deben ser inicializadas en el punto de entrada (index.js o config).
// Las mantenemos aquí para que el servicio sea "usable", pero deben ser tratadas como constantes.
const S3_BUCKET_NAME = 'rak-orion-invoice-reports';
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'MOCK_KEY_ID', 
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'MOCK_SECRET',
    region: process.env.AWS_REGION || 'us-east-1'
});
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'MOCK_API_KEY');
const aiModel = 'gemini-2.5-flash'; 


/**
 * Función para simular la subida de un archivo a S3.
 */
const uploadToS3 = async (fileName, fileBuffer) => {
    console.log(`[S3 SIMULATION] Subiendo archivo: ${fileName} al bucket ${S3_BUCKET_NAME}`);
    
    // Simular el guardado de la URL
    const publicUrl = `https://${S3_BUCKET_NAME}.s3.amazonaws.com/${fileName}`;
    
    // En un entorno local, podríamos guardarlo en un array global mock para listarlo después
    if (global.mockS3Files) {
        global.mockS3Files.push({ key: fileName, url: publicUrl, size: fileBuffer.length, date: new Date() });
    }
    
    console.log(`[S3 SIMULATION] Subida exitosa. URL: ${publicUrl}`);
    return publicUrl;
};

/**
 * Función para generar el archivo XLS a partir de los datos del portafolio.
 */
const generateXLSReport = async (portfolioData) => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Reporte de Facturas');

    // 1. Definición de Columnas
    sheet.columns = [
        { header: 'ID Factura', key: 'id', width: 10 },
        { header: 'Cliente (Razón Social)', key: 'clientName', width: 35 },
        { header: 'Monto Total', key: 'totalAmount', width: 15, style: { numFmt: '"$"#,##0.00' } },
        { header: 'Saldo Pendiente', key: 'saldoPendiente', width: 15, style: { numFmt: '"$"#,##0.00' } },
        { header: 'Fecha Vencimiento', key: 'dueDate', width: 18, style: { numFmt: 'yyyy-mm-dd' } },
        { header: 'Estatus', key: 'status', width: 25 },
        { header: 'Método Pago', key: 'metodoPago', width: 15 },
        { header: 'Email Contacto', key: 'contactEmail', width: 30 },
    ];

    // Aplicar estilo de encabezado
    sheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D47A1' } }; // Azul RAK
    });

    // 2. Llenado de Filas
    portfolioData.forEach((item) => {
        sheet.addRow({
            id: item.id,
            clientName: item.client.name,
            totalAmount: parseFloat(item.total_amount),
            saldoPendiente: parseFloat(item.saldoPendiente),
            dueDate: new Date(item.due_date),
            status: item.status,
            metodoPago: item.metodo_pago,
            contactEmail: item.client.contact_email,
        });
    });
    
    // 3. Generar Buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
};

/**
 * Función para analizar el reporte con IA (Gemini).
 */
const analyzeReportWithAI = async (reportData) => {
    // Tomamos solo los datos relevantes para el análisis de cartera
    const analysisData = reportData.map(item => ({
        id: item.id,
        client: item.client.name,
        saldo: item.saldoPendiente,
        status: item.status,
        due_date: new Date(item.due_date).toISOString().split('T')[0]
    }));
    
    const reportString = JSON.stringify(analysisData, null, 2);

    const systemPrompt = `Eres un Analista Financiero de RAK. Analiza la siguiente cartera de facturas. Identifica 3 áreas clave de riesgo (Vencimiento, Alto Saldo, Concentración de Clientes) y proporciona un resumen conciso con recomendaciones de cobro. NO inventes datos.`;
    const userQuery = `Fecha de hoy: ${new Date().toISOString().split('T')[0]}. Esta es la cartera:\n${reportString}`;

    try {
        console.log('[IA ANALYZER] Solicitando análisis a Gemini...');
        const response = await ai.models.generateContent({
            model: aiModel,
            contents: [{ role: 'user', parts: [{ text: userQuery }] }],
            config: {
                systemInstruction: systemPrompt
            }
        });
        
        return response.text;
    } catch (error) {
        console.error('[IA ANALYZER] Error al conectar con Gemini:', error);
        return 'Análisis de IA fallido debido a un error de conexión o API.';
    }
};

/**
 * Función principal que orquesta la generación del reporte, análisis y subida.
 */
const processInvoiceReport = async (req) => {
    // 1. Obtener la fuente de datos (Portafolio de la Fase 1)
    const portfolioData = await paymentFollowUpService.getFollowUpPortfolio();
    
    if (!portfolioData || portfolioData.length === 0) {
        return { success: false, message: "No se encontraron facturas para el reporte." };
    }

    // 2. Generar el archivo XLS (Buffer)
    const fileBuffer = await generateXLSReport(portfolioData);
    
    // 3. Simular la subida a S3
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `reporte-facturas-${timestamp}.xlsx`;
    const reportUrl = await uploadToS3(fileName, fileBuffer);
    
    // 4. Analizar el portafolio con IA
    const analysisResult = await analyzeReportWithAI(portfolioData);

    return { 
        success: true, 
        message: 'Reporte generado, analizado y almacenado.',
        fileName: fileName,
        url: reportUrl,
        aiAnalysis: analysisResult
    };
};

/**
 * 5. Endpoint para listar el repositorio (simulación)
 */
const listUploadedReports = async () => {
    // Inicializar el mock si no existe (debe ir en index.js, pero lo dejamos aquí como fallback)
    if (!global.mockS3Files) {
        global.mockS3Files = [];
    }
    
    return {
        success: true,
        repositoryName: S3_BUCKET_NAME,
        files: global.mockS3Files.map(f => ({
            key: f.key,
            url: f.url,
            size: `${(f.size / 1024).toFixed(1)} KB`,
            date: f.date.toISOString()
        }))
    };
}


module.exports = {
    processInvoiceReport,
    listUploadedReports
};
