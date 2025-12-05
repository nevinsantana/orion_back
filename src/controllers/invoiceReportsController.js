const invoiceReportsService = require("../services/invoiceReportsService");
const paymentFollowUpService = require("../services/paymentFollowUpService"); 
const { response } = require("../utils/handleResponse");

/**
 * 1. GET /api/invoiceReports/data
 * Obtiene la lista de facturas para mostrar en tabla antes de exportar.
 */
const getInvoicesReportData = async (req, res) => {
  try {
    // Reusamos la lógica de cartera que ya filtra y calcula estatus
    const portfolio = await paymentFollowUpService.getFollowUpPortfolio();
    response.succes(res, portfolio, 200);
  } catch (error) {
    console.error("[ERROR] [InvoiceReports] [Data]", error);
    response.error(res, "Error al obtener datos para el reporte.", 500);
  }
};

/**
 * 2. POST /api/invoiceReports/xls
 * Genera el XLS, lo sube a AWS S3 y devuelve la URL pública.
 */
const generateAndUploadXLS = async (req, res) => {
  try {
    // El servicio ahora usará s3Service internamente
    const result = await invoiceReportsService.processInvoiceReport(req);

    if (!result.success) {
      return response.error(res, result.message, 400);
    }

    // Devolvemos la URL de S3 al frontend
    response.succes(res, result, 200); 
  } catch (error) {
    console.error("[ERROR] [InvoiceReports] [GenerateXLS]", error);
    response.error(res, "Error fatal al generar el reporte S3.", 500);
  }
};

/**
 * 3. GET /api/invoiceReports/repo
 * Lista los archivos que existen realmente en el bucket S3.
 */
const listRepositoryInvoices = async (req, res) => {
  try {
    const result = await invoiceReportsService.listUploadedReports();
    response.succes(res, result, 200);
  } catch (error) {
    console.error("[ERROR] [InvoiceReports] [ListRepo]", error);
    response.error(res, "Error al listar archivos de S3.", 500);
  }
};

/**
 * 4. GET /api/invoiceReports/aging
 * Datos en crudo para el reporte de antigüedad (JSON).
 */
const getAgingReport = async (req, res) => {
  try {
    const filters = req.query;
    const reportData = await invoiceReportsService.getAgingReportData(filters);
    response.succes(res, reportData, 200);
  } catch (error) {
    console.error("[ERROR] [InvoiceReports] [AgingData]", error);
    response.error(res, "Error al obtener reporte de antigüedad.", 500);
  }
};

/**
 * 5. POST /api/invoiceReports/aging/xls
 * Genera reporte de Antigüedad y sube a S3.
 */
const generateAgingXLS = async (req, res) => {
  try {
    const filters = req.query;
    const result = await invoiceReportsService.processAgingReport(filters);

    if (!result.success) {
      return response.error(res, result.message, 400);
    }
    response.succes(res, result, 200);
  } catch (error) {
    console.error("[ERROR] [InvoiceReports] [AgingXLS]", error);
    response.error(res, "Error generando reporte de antigüedad.", 500);
  }
};

/**
 * 6. GET /api/invoiceReports/aging/repo
 * Reutiliza el listado del bucket.
 */
const listAgingRepository = async (req, res) => {
  listRepositoryInvoices(req, res);
};

module.exports = {
  getInvoicesReportData,
  generateAndUploadXLS,
  listRepositoryInvoices,
  getAgingReport,
  generateAgingXLS,
  listAgingRepository,
};