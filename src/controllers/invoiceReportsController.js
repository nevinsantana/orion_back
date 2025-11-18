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

/**
 * 4. GET /api/invoiceReports/aging
 * Obtiene el reporte de Antigüedad de Cuentas por Cobrar.
 */
const getAgingReport = async (req, res) => {
  // Reutilizamos el servicio de reportes, pasándole los filtros (req.query)
  try {
    const filters = req.query; // Captura date_from, date_to, etc.
    const reportData = await invoiceReportsService.getAgingReportData(filters);

    response.succes(res, reportData, 200);
  } catch (error) {
    console.error("[ERROR] [InvoiceReports] [getAgingReport]", error);
    response.error(
      res,
      "Error al obtener el reporte de antigüedad de cuentas.",
      500
    );
  }
};

/**
 * 5. POST /api/invoiceReports/aging/xls
 * Genera el archivo XLS del reporte de Antigüedad.
 */
const generateAgingXLS = async (req, res) => {
  try {
    const filters = req.query; // Pasa filtros al servicio
    const result = await invoiceReportsService.processAgingReport(filters);

    if (!result.success) {
      return response.error(res, result.message, 400);
    }

    response.succes(res, result, 202);
  } catch (error) {
    console.error("[ERROR] [InvoiceReports] [generateAgingXLS]", error);
    response.error(
      res,
      "Error fatal al generar el reporte de antigüedad.",
      500
    );
  }
};

/**
 * 6. GET /api/invoiceReports/aging/repo
 * Lista los archivos XLS del repositorio de Antigüedad.
 */
const listAgingRepository = async (req, res) => {
  // Reutilizamos el listado general de S3 Mock
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
