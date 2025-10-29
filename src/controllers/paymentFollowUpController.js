const paymentFollowUpService = require("../services/paymentFollowUpService");
const { response } = require("../utils/handleResponse"); // Importación del helper

/**
 * GET - Cartera de Seguimiento de Pagos (Read All)
 * Endpoint: /api/paymentFollowUp/portfolio
 */
const getPaymentPortfolio = async (req, res) => {
  try {
    // 1. El controlador llama al servicio para obtener los datos procesados
    const portfolio = await paymentFollowUpService.getFollowUpPortfolio();

    // Respuesta exitosa usando el helper, enviando el portafolio en el 'body'
    response.succes(res, portfolio, 200);
  } catch (error) {
    console.error("[ERROR] [PaymentFollowUp] [getPaymentPortfolio]", error);
    // Respuesta de error usando el helper (código 500 por defecto)
    response.error(res, "Error al obtener el portafolio de seguimiento.", 500);
  }
};

/**
 * GET - Obtener un registro específico (Read Single)
 * Endpoint: /api/paymentFollowUp/:id
 */
const getSingleFollowUp = async (req, res) => {
  console.log("-----");
  console.log("ENTRA INICIALMENTE");
  console.log("-----");
  try {
    const { id } = req.params;

    // --- CORRECCIÓN CRUCIAL: Llamar al servicio getSingleFollowUp ---
    // Usamos el servicio diseñado para la consulta detallada, incluyendo includes.
    const singleFollowUp = await paymentFollowUpService.getSingleFollowUp(id);

    if (!singleFollowUp) {
      // Si el servicio devuelve null (no encontrado), regresamos 404
      return response.error(res, "Seguimiento de factura no encontrado.", 404);
    }

    // Respuesta exitosa
    response.succes(res, singleFollowUp, 200);
  } catch (error) {
    console.error(`[ERROR] [PaymentFollowUp] [getSingleFollowUp]`, error);
    // Respuesta de error 500
    response.error(
      res,
      "Ha ocurrido un error inesperado al obtener el detalle de seguimiento.",
      500
    );
  }
};

module.exports = {
  getPaymentPortfolio,
  getSingleFollowUp,
};
