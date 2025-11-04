const { Invoice, PaymentHistory, Client } = require("../models");
const { Op, literal, fn, col } = require("sequelize");

/**
 * Función para garantizar la precisión decimal en cálculos financieros.
 * Multiplica por 100 para trabajar con enteros y evitar errores de coma flotante.
 * @param {number} a - Primer número.
 * @param {number} b - Segundo número.
 * @returns {number} La resta con precisión de 2 decimales.
 */
const subtractPrecise = (a, b) => {
  return (Math.round(a * 100) - Math.round(b * 100)) / 100;
};

/**
 * Calcula el estatus y saldo pendiente de una factura.
 */
const calculateInvoiceStatus = (invoice) => {
  // La suma de pagos viene de la asociación 'paymentHistory' o de la subconsulta (paid_amount_sum)
  const paid_amount = invoice.paymentHistory
    ? invoice.paymentHistory.reduce(
        (sum, payment) => sum + parseFloat(payment.amount),
        0
      )
    : parseFloat(invoice.paid_amount_sum || invoice.paid_amount || 0);

  const total_amount = parseFloat(invoice.total_amount);

  // USAMOS LA FUNCIÓN PRECISA
  const saldoPendiente = subtractPrecise(total_amount, paid_amount);

  const dueDate = new Date(invoice.due_date);
  const today = new Date();

  // Regla 1: Pagada (si el saldo es 0 o negativo, significa que ya se cubrió)
  const isPaidInFull = saldoPendiente <= 0.0;

  let status = "Pendiente";

  if (isPaidInFull) {
    status = "Pagada";
  } else if (today > dueDate) {
    status = "Vencida";
  } else if ((dueDate - today) / (1000 * 60 * 60 * 24) <= 7) {
    status = "Por Vencer (7 días)";
  }

  return {
    status: status,
    saldoPendiente: Math.max(0, saldoPendiente).toFixed(2),
    paid_amount_sum: paid_amount.toFixed(2),
  };
};

/**
 * Obtiene la cartera de facturas con el estatus de seguimiento de pago calculado.
 * @param {object} filters - Objeto con filtros opcionales (date_from, date_to).
 * @returns {Promise<Array>} Lista de facturas con estatus de seguimiento.
 */
const getFollowUpPortfolio = async (filters = {}) => {
  // Lógica para aplicar el filtro de fechas y el límite de 100
  const whereCondition = { deleted_at: { [Op.is]: null } };
  let limit = null;

  const { date_from, date_to } = filters;

  if (date_from || date_to) {
    // Si se proporciona ALGÚN filtro de fecha, aplicamos el rango
    whereCondition.created_at = {
      // Rango: Mayor o igual a date_from Y Menor o igual a date_to
      [Op.between]: [
        date_from || new Date(0), // Si date_from es nulo, usa la fecha mínima (01-01-1970)
        date_to ? new Date(date_to) : new Date(), // Si date_to es nulo, usa hoy
      ],
    };
  } else {
    // Regla: Si NO hay filtros de fecha, mostrar solo los últimos 100
    limit = 100;
  }

  const invoices = await Invoice.findAll({
    attributes: [
      "id",
      ["client_id", "clientId"],
      "total_amount",
      "due_date",
      "metodo_pago",
      [
        literal(
          "(SELECT SUM(amount) FROM payment_history WHERE payment_history.invoice_id = Invoice.id)"
        ),
        "paid_amount_sum",
      ],
    ],
    include: [
      {
        model: Client,
        as: "client",
        attributes: ["id", "name", "contact_email"],
      },
    ],
    where: whereCondition, // Aplicamos el filtro que construimos
    order: [["due_date", "ASC"]], // Ordenamos por fecha de vencimiento
    limit: limit, // Aplicamos el límite (será null si hay filtros de fecha, o 100 si no los hay)
  });

  const portfolio = invoices.map((invoice) => {
    const rawInvoice = invoice.get({ plain: true });

    const calculatedStatus = calculateInvoiceStatus(rawInvoice);

    return {
      ...rawInvoice,
      ...calculatedStatus,
      paid_amount_sum: undefined,
    };
  });

  return portfolio;
};

/**
 * Obtiene el seguimiento detallado de una sola factura.
 * Usa JOINs y suma la cuenta en memoria para evitar conflictos SQL (findByPk).
 */
const getSingleFollowUp = async (id) => {
  // Buscamos la factura con TODOS los includes
  const invoice = await Invoice.findByPk(id, {
    attributes: [
      "id",
      ["client_id", "clientId"],
      "total_amount",
      "due_date",
      "metodo_pago",
    ],
    include: [
      {
        model: Client,
        as: "client",
        attributes: ["id", "name", "contact_email"],
      },
      {
        model: PaymentHistory,
        as: "paymentHistory",
        attributes: ["paymentDate", "amount", "paymentMethod", "description"],
        required: false,
      },
    ],
  });

  // Si la factura no existe (o el include falló silenciosamente), regresamos null
  if (!invoice) return null;

  const rawInvoice = invoice.get({ plain: true });

  // 2. Calculamos el estatus en memoria (en JS)
  const calculated = calculateInvoiceStatus(rawInvoice);

  return {
    ...rawInvoice,
    ...calculated,
    paymentHistory: rawInvoice.paymentHistory, // Incluye la lista de pagos
    paid_amount_sum: undefined,
  };
};

module.exports = {
  getFollowUpPortfolio,
  getSingleFollowUp,
};
