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
    : parseFloat(invoice.paid_amount_sum || invoice.paid_amount || 0); // Asume el resultado de la subconsulta si no hay include

  const total_amount = parseFloat(invoice.total_amount);

  // USAMOS LA FUNCIÓN PRECISA
  const saldoPendiente = subtractPrecise(total_amount, paid_amount);

  const dueDate = new Date(invoice.due_date);
  const today = new Date();

  // Regla 1: Pagada (si el saldo es 0 o negativo, significa que ya se cubrió)
  const isPaidInFull = saldoPendiente <= 0.0; // Comparación segura

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
 */
const getFollowUpPortfolio = async () => {
  // Este método usa la subconsulta literal para eficiencia del listado general
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
        "paid_amount_sum", // Usamos este alias en snake_case
      ],
    ],
    include: [
      {
        model: Client,
        as: "client",
        attributes: ["id", "name", "contact_email"],
      },
    ],
    where: { deleted_at: { [Op.is]: null } },
    order: [["due_date", "ASC"]], // Ordenamos por fecha de vencimiento
  });

  const portfolio = invoices.map((invoice) => {
    const rawInvoice = invoice.get({ plain: true });

    const calculatedStatus = calculateInvoiceStatus(rawInvoice);

    return {
      ...rawInvoice,
      ...calculatedStatus,
      paid_amount_sum: undefined, // Limpiamos el campo técnico
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

  // 2. Calculamos el estatus en memoria (en JS) sumando los pagos
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
