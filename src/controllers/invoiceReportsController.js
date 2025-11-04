const invoiceReportsService = require("../services/invoiceReportsService");
const paymentFollowUpService = require("../services/paymentFollowUpService"); // Reusa la lógica de estatus
const { response } = require("../utils/handleResponse");

/**
 * 1. GET /api/invoiceReports/data
 * Obtiene la lista de facturas con estatus calculado, con soporte para filtros.
 */
const getInvoicesReportData = async (req, res) => {
  // Usamos el servicio de pagos directamente, ya que el portafolio es la fuente de datos
  try {
    const portfolio = await paymentFollowUpService.getFollowUpPortfolio();

    // El servicio de portafolio ya filtra y calcula los estatus
    response.succes(res, portfolio, 200);
  } catch (error) {
    console.error("[ERROR] [InvoiceReports] [getInvoicesReportData]", error);
    response.error(res, "Error al obtener datos para el reporte.", 500);
  }
};

/**
 * 2. POST /api/invoiceReports/xls
 * Genera el XLS, sube a S3 (simulación) y usa IA.
 */
const generateAndUploadXLS = async (req, res) => {
  try {
    const result = await invoiceReportsService.processInvoiceReport(req);

    if (!result.success) {
      // Si el servicio devuelve success: false (ej: no hay facturas), enviamos 400 o 404
      return response.error(res, result.message, 400);
    }

    // 202 Accepted: La tarea fue aceptada y se está procesando (o ya terminó en este caso)
    response.succes(res, result, 202);
  } catch (error) {
    console.error("[ERROR] [InvoiceReports] [generateAndUploadXLS]", error);
    response.error(res, "Error fatal al generar el reporte.", 500);
  }
};

/**
 * 3. GET /api/invoiceReports/repo
 * Lista los archivos XLS subidos a S3 (simulación).
 */
const listRepositoryInvoices = async (req, res) => {
  try {
    const result = await invoiceReportsService.listUploadedReports();

    response.succes(res, result, 200);
  } catch (error) {
    console.error("[ERROR] [InvoiceReports] [listRepositoryInvoices]", error);
    response.error(res, "Error al listar el repositorio.", 500);
  }
};

module.exports = {
  getInvoicesReportData,
  generateAndUploadXLS,
  listRepositoryInvoices,
};
