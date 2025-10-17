const { Invoice, PaymentHistory, Client } = require('../models');
const { Op, literal, fn, col } = require('sequelize');

// Función para calcular estatus (se mantiene igual)
const calculateInvoiceStatus = (invoice) => {
    // La suma de pagos ahora viene de la asociación 'paymentHistory'
    const paid_amount = invoice.paymentHistory 
        ? invoice.paymentHistory.reduce((sum, payment) => sum + parseFloat(payment.amount), 0)
        : 0;

    const total_amount = parseFloat(invoice.total_amount);
    
    const saldoPendiente = total_amount - paid_amount;
    const dueDate = new Date(invoice.due_date);
    const today = new Date();
    
    const isPaidInFull = saldoPendiente <= 0;

    let status = 'Pendiente';
    
    if (isPaidInFull) {
        status = 'Pagada';
    } else if (today > dueDate) {
        status = 'Vencida';
    } else if ((dueDate - today) / (1000 * 60 * 60 * 24) <= 7) {
        status = 'Por Vencer (7 días)';
    }

    return {
        status: status,
        saldoPendiente: Math.max(0, saldoPendiente).toFixed(2),
        paid_amount_sum: paid_amount.toFixed(2) // Agregamos la suma aquí
    };
};

// ... [getFollowUpPortfolio se mantiene igual usando la subconsulta literal] ...
const getFollowUpPortfolio = async () => {
    // Este método usa la subconsulta literal porque funciona bien en findAll y es eficiente para el listado general
    // ... [código de getFollowUpPortfolio omitido] ...
    const invoices = await Invoice.findAll({
        attributes: [
            'id', 
            ['client_id', 'clientId'], 
            'total_amount', 
            'due_date', 
            'metodo_pago',
            [
                literal('(SELECT SUM(amount) FROM payment_history WHERE payment_history.invoice_id = Invoice.id)'),
                'paid_amount'
            ]
        ],
        include: [{
            model: Client,
            as: 'client',
            attributes: ['id', 'name', 'contact_email']
        }],
        where: { deleted_at: { [Op.is]: null } }
    });

    const portfolio = invoices.map(invoice => {
        const rawInvoice = invoice.get({ plain: true });
        // Mapeamos el campo 'paid_amount' a 'paid_amount_sum' para usar el cálculo
        rawInvoice.paid_amount_sum = rawInvoice.paid_amount; 
        const calculatedStatus = calculateInvoiceStatus(rawInvoice);

        return {
            ...rawInvoice,
            ...calculatedStatus,
            paid_amount: undefined 
        };
    });

    return portfolio;
};

/**
 * Obtiene el seguimiento detallado de una sola factura. (SOLUCIÓN FINAL: Sin Subconsulta Literal)
 */
const getSingleFollowUp = async (id) => {
    // 1. Buscamos la factura con TODOS los includes
    const invoice = await Invoice.findByPk(id, {
        attributes: [
            'id', 
            ['client_id', 'clientId'],
            'total_amount', 
            'due_date', 
            'metodo_pago'
            // NOTA: Eliminamos la subconsulta literal de paid_amount_sum de aquí.
        ],
        include: [
            {
                model: Client,
                as: 'client',
                attributes: ['id', 'name', 'contact_email']
            },
            {
                model: PaymentHistory,
                as: 'paymentHistory', 
                attributes: ['paymentDate', 'amount', 'paymentMethod', 'description'],
                required: false 
            }
        ],
    });

    // Si la factura no existe, regresamos null (y el controlador devuelve 404)
    if (!invoice) {
        console.error(`[DEBUG SERVICE] Factura ID ${id} no encontrada después del findByPk.`);
        return null;
    }

    const rawInvoice = invoice.get({ plain: true });
    
    // 2. Calculamos el estatus en memoria (en JS)
    const calculated = calculateInvoiceStatus(rawInvoice);

    return {
        ...rawInvoice,
        ...calculated,
        paymentHistory: rawInvoice.paymentHistory, // Incluye la lista de pagos
        paid_amount_sum: undefined // Limpiamos el campo técnico
    };
};


module.exports = {
    getFollowUpPortfolio,
    getSingleFollowUp
};
