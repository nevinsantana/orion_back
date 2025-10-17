const { Invoice, PaymentHistory, Client } = require('../models');
const { Op, literal } = require('sequelize');

/**
 * Calcula el estatus y saldo pendiente de una factura.
 * @param {object} invoice - El objeto de la factura con los montos pagados y totales.
 * @returns {object} Un objeto con el saldo y estatus calculado.
 */
const calculateInvoiceStatus = (invoice) => {
    // Definición de las reglas de negocio para el estatus
    const dueDate = new Date(invoice.due_date);
    const today = new Date();
    const isPaidInFull = invoice.total_amount <= (invoice.paid_amount || 0);

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
        saldoPendiente: Math.max(0, invoice.total_amount - (invoice.paid_amount || 0))
    };
};

/**
 * Servicio para obtener la cartera de facturas con sus estatus de seguimiento.
 * @returns {Array<object>} Lista de facturas con estatus de pago.
 */
const getFollowUpPortfolio = async () => {
    // 1. Obtener la suma total de pagos por factura (Usando Sequelize literal para eficiencia)
    const invoicesWithPayments = await Invoice.findAll({
        attributes: [
            'id', 
            'clientId', 
            'total_amount', // Campo necesario del modelo Invoice
            'due_date', // Campo necesario del modelo Invoice
            'metodo_pago',
            // Calcula el monto pagado sumando todos los registros de PaymentHistory asociados
            [literal('(SELECT SUM(amount) FROM payment_history WHERE payment_history.invoice_id = Invoice.id)'), 'paid_amount'] 
        ],
        include: [{
            model: Client,
            as: 'client',
            attributes: ['id', 'name', 'contact_email']
        }]
    });

    // 2. Procesar cada factura para calcular el saldo y el estatus
    const portfolio = invoicesWithPayments.map(invoice => {
        const data = invoice.toJSON();
        
        // Convertir a número para cálculos precisos (ya que vienen de DECIMAL en DB)
        data.total_amount = parseFloat(data.total_amount);
        data.paid_amount = parseFloat(data.paid_amount || 0);
        
        const { status, saldoPendiente } = calculateInvoiceStatus(data);
        
        return {
            invoiceId: data.id,
            clientName: data.client.name,
            clientEmail: data.client.contact_email,
            metodoPago: data.metodo_pago,
            total: data.total_amount,
            pagado: data.paid_amount,
            saldoPendiente: parseFloat(saldoPendiente.toFixed(2)),
            fechaVencimiento: data.due_date,
            estatus: status,
            // Bandera de acción: Indica si se necesita una notificación (por vencer o vencida)
            necesitaNotificacion: status === 'Por Vencer (7 días)' || status === 'Vencida'
        };
    });

    return portfolio;
};

module.exports = {
    getFollowUpPortfolio
};
