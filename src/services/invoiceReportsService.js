const { Op, literal } = require("sequelize");
const paymentFollowUpService = require("./paymentFollowUpService");
const { generateXLSReport } = require("../utils/excelGenerator");
// 👇 CAMBIO 1: Importamos el nuevo servicio híbrido (S3 Real / Mock Local)
const { uploadFile, listFiles } = require("./s3Service");
const geminiService = require("./geminiService");

/**
 * Función principal que orquesta la generación del Reporte de ESTADO, análisis y subida.
 */
const processInvoiceReport = async (req) => {
  // 1. Obtener la fuente de datos (Portafolio)
  const portfolioData = await paymentFollowUpService.getFollowUpPortfolio();

  if (!portfolioData || portfolioData.length === 0) {
    return {
      success: false,
      message: "No se encontraron facturas para el reporte.",
    };
  }

  // 2. Generar el archivo XLS (Buffer)
  const fileBuffer = await generateXLSReport(
    portfolioData,
    "Reporte de Estado"
  );

  // 3. Subir a S3 (o Mock) - 👇 CAMBIO 2: Usamos uploadFile con mimeType
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `reporte-facturas-${timestamp}.xlsx`;
  const mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  
  // Esta función decide sola si usar AWS S3 (Prod) o Mock (Local)
  const reportUrl = await uploadFile(fileName, fileBuffer, mimeType);

  // 4. Analizar el portafolio con IA
  const analysisResult = await analyzeReportWithAI(portfolioData);

  return {
    success: true,
    message: "Reporte generado, analizado y almacenado.",
    fileName: fileName,
    url: reportUrl,
    aiAnalysis: analysisResult,
  };
};

/**
 * 5. Endpoint para listar el repositorio
 */
const listUploadedReports = async () => {
  // 👇 CAMBIO 3: Usamos el listado del servicio híbrido
  return await listFiles();
};

/**
 * Lógica para calcular y agrupar la antigüedad de las cuentas por cobrar.
 * (Se mantiene intacta tu lógica original)
 */
const getAgingReportData = async (filters = {}) => {
  const portfolio = await paymentFollowUpService.getFollowUpPortfolio(filters);
  const today = new Date();

  const agingData = portfolio
    .map((item) => {
      const dueDate = new Date(item.due_date);
      const daysOverdue =
        item.saldoPendiente > 0 && today > dueDate
          ? Math.floor((today - dueDate) / (1000 * 60 * 60 * 24))
          : 0;

      let agingRange = "Al Corriente";

      if (daysOverdue > 0) {
        if (daysOverdue <= 30) agingRange = "0 - 30 Días";
        else if (daysOverdue <= 60) agingRange = "31 - 60 Días";
        else if (daysOverdue <= 90) agingRange = "61 - 90 Días";
        else agingRange = "Más de 90 Días";
      }

      return {
        ...item,
        daysOverdue: daysOverdue,
        agingRange: agingRange,
      };
    })
    .filter((item) => item.saldoPendiente > 0);

  return agingData;
};

/**
 * Función principal que orquesta la generación del reporte de Antigüedad, análisis y subida.
 */
const processAgingReport = async (filters) => {
  // 1. Obtener la fuente de datos (Antigüedad)
  const agingData = await getAgingReportData(filters);

  if (!agingData || agingData.length === 0) {
    return {
      success: false,
      message:
        "No se encontraron facturas con saldo pendiente para el reporte de antigüedad.",
    };
  }

  // 2. Generar el archivo XLS
  const fileBuffer = await generateXLSReport(
    agingData,
    "Reporte de Antigüedad"
  );

  // 3. Subir a S3 - 👇 CAMBIO 4: Usamos uploadFile con mimeType
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `reporte-antiguedad-${timestamp}.xlsx`;
  const mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

  const reportUrl = await uploadFile(fileName, fileBuffer, mimeType);

  // 4. Analizar el portafolio con IA
  const analysisResult = await analyzeAgingReportWithAI(agingData);

  return {
    success: true,
    message: "Reporte de antigüedad generado, analizado y almacenado.",
    fileName: fileName,
    url: reportUrl,
    aiAnalysis: analysisResult,
  };
};

/**
 * Realiza el análisis del reporte de Antigüedad (Lógica original mantenida).
 */
const analyzeAgingReportWithAI = async (agingData) => {
  const simplifiedAgingData = agingData.map((item) => ({
    client: item.client ? item.client.name : "N/A",
    invoiceId: item.invoiceId,
    saldoPendiente: item.saldoPendiente,
    daysOverdue: item.daysOverdue,
    agingRange: item.agingRange,
  }));

  const systemPrompt = `Eres un Analista de Riesgos Financieros experto que trabaja para RAK Orion. Tu objetivo es analizar la antigüedad de saldos y sugerir estrategias de cobranza.`;

  const userQuery = `Fecha actual: ${
    new Date().toISOString().split("T")[0]
  }. Analiza esta cartera de facturas por cobrar:\n\`\`\`json\n${JSON.stringify(
    simplifiedAgingData,
    null,
    2
  )}\n\`\`\``;

  try {
    const aiResponse = await geminiService.generateContent(
      systemPrompt,
      userQuery
    );
    return aiResponse;
  } catch (error) {
    console.error("Error al analizar el reporte de antigüedad con IA:", error);
    return "Análisis de IA fallido. Error: " + error.message;
  }
};

/**
 * Realiza el análisis del Reporte de ESTADO (Lógica original mantenida).
 */
const analyzeReportWithAI = async (reportData) => {
  const simplifiedData = reportData.map((item) => ({
    client: item.client.name,
    saldo: item.saldoPendiente,
    status: item.status,
    due_date: new Date(item.due_date).toISOString().split("T")[0],
  }));

  const systemPrompt = `Eres un Analista Financiero de RAK Orion. Tu trabajo es interpretar el estado de las facturas y dar un resumen ejecutivo.`;

  const userQuery = `Fecha de hoy: ${
    new Date().toISOString().split("T")[0]
  }. Esta es la cartera:\n${JSON.stringify(simplifiedData, null, 2)}`;

  try {
    const aiResponse = await geminiService.generateContent(
      systemPrompt,
      userQuery
    );
    return aiResponse;
  } catch (error) {
    console.error("[IA ANALYZER] Error al conectar con Gemini:", error);
    return "Análisis de IA fallido debido a un error de conexión o API.";
  }
};

module.exports = {
  processInvoiceReport,
  listUploadedReports,
  getAgingReportData,
  processAgingReport,
};