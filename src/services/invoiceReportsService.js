const { Op, literal } = require("sequelize");
const paymentFollowUpService = require("./paymentFollowUpService");
const { generateXLSReport } = require("../utils/excelGenerator"); // Asumo que esto genera el XLS
const { uploadToS3, listMockedReports } = require("../utils/s3Mock"); // Asumo que estos son tus helpers de S3
const geminiService = require("./geminiService"); // Tu servicio/helper de conexión a la IA

// *******************************************************************
// NOTA: Se eliminan las redefiniciones de uploadToS3, generateXLSReport,
// y la inicialización de AWS/Gemini. Ahora solo se usan los helpers importados.
// *******************************************************************

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

  // 2. Generar el archivo XLS (Buffer) - Usando el helper importado
  const fileBuffer = await generateXLSReport(
    portfolioData,
    "Reporte de Estado"
  );

  // 3. Simular la subida a S3 - Usando el helper importado
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `reporte-facturas-${timestamp}.xlsx`;
  const reportUrl = await uploadToS3(fileName, fileBuffer);

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
 * 5. Endpoint para listar el repositorio (simulación)
 */
const listUploadedReports = async () => {
  // Usamos el helper de S3 Mock para listar los archivos.
  // Esto ya está inicializado en index.js.
  return listMockedReports();
};

/**
 * Lógica para calcular y agrupar la antigüedad de las cuentas por cobrar.
 * (Esta función DEBE estar en este servicio, ya que construye la estructura del reporte de antigüedad)
 */
const getAgingReportData = async (filters = {}) => {
  // NOTA: La lógica de filtros y límite de 100 se delega al servicio de pagos.
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
    .filter((item) => item.saldoPendiente > 0); // Solo mostramos facturas con saldo

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

  // 2. Generar el archivo XLS - Usando el helper
  const fileBuffer = await generateXLSReport(
    agingData,
    "Reporte de Antigüedad"
  );

  // 3. Simular la subida a S3
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `reporte-antiguedad-${timestamp}.xlsx`;
  const reportUrl = await uploadToS3(fileName, fileBuffer);

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
 * Realiza el análisis del reporte de Antigüedad.
 */
const analyzeAgingReportWithAI = async (agingData) => {
  const simplifiedAgingData = agingData.map((item) => ({
    client: item.client ? item.client.name : "N/A",
    invoiceId: item.invoiceId,
    saldoPendiente: item.saldoPendiente,
    daysOverdue: item.daysOverdue,
    agingRange: item.agingRange,
  }));

  const systemPrompt = `Eres un Analista de Riesgos Financieros experto... [código del prompt anterior]`;

  const userQuery = `Fecha actual: ${
    new Date().toISOString().split("T")[0]
  }. Analiza esta cartera de facturas por cobrar:\n\`\`\`json\n${JSON.stringify(
    simplifiedAgingData,
    null,
    2
  )}\n\`\`\``;

  try {
    // USAMOS EL HELPER GEMINI
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
 * Realiza el análisis del Reporte de ESTADO.
 */
const analyzeReportWithAI = async (reportData) => {
  const simplifiedData = reportData.map((item) => ({
    client: item.client.name,
    saldo: item.saldoPendiente,
    status: item.status,
    due_date: new Date(item.due_date).toISOString().split("T")[0],
  }));

  const systemPrompt = `Eres un Analista Financiero de RAK... [código del prompt anterior]`;

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
