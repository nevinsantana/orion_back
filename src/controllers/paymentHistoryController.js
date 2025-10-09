const { PaymentHistory, Invoice } = require('../models');
const { Op } = require('sequelize');

/**
 * GET all Payment History records
 * Endpoint: /api/paymentHistory
 */
const getPaymentHistory = async (req, res) => {
    try {
        const paymentHistory = await PaymentHistory.findAll({
            include: [{
                model: Invoice,
                as: 'invoice',
                attributes: ['id', 'name', 'rfc']
            }],
            attributes: ['id', 'invoiceId', 'paymentDate', 'amount', 'paymentMethod', 'description', 'created_at', 'updated_at']
        });

        res.status(200).json({
            code: 1,
            data: paymentHistory,
        });
    } catch (error) {
        console.error(`[ERROR] [PaymentHistory] [getPaymentHistory]`, error);
        res.status(500).json({
            code: 0,
            message: 'Ha ocurrido un error inesperado. Intente nuevamente.'
        });
    }
};

/**
 * GET a single Payment History record
 * Endpoint: /api/paymentHistory/:id
 */
const getSinglePaymentHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const paymentData = await PaymentHistory.findByPk(id, {
            include: [{
                model: Invoice,
                as: 'invoice',
                attributes: ['id', 'name', 'rfc']
            }],
            attributes: ['id', 'invoiceId', 'paymentDate', 'amount', 'paymentMethod', 'description', 'created_at', 'updated_at']
        });

        if (!paymentData) {
            return res.status(404).json({ code: 0, message: 'Registro de pago no encontrado.' });
        }

        res.status(200).json({ code: 1, data: paymentData });
    } catch (error) {
        console.error(`[ERROR] [PaymentHistory] [getSinglePaymentHistory]`, error);
        res.status(500).json({
            code: 0,
            message: 'Ha ocurrido un error inesperado. Intente nuevamente.'
        });
    }
};

/**
 * POST (Create) a new Payment History record
 * Endpoint: /api/paymentHistory
 */
const postPaymentHistory = async (req, res) => {
    try {
        const { invoiceId, paymentDate, amount, paymentMethod, description } = req.body;

        if (!invoiceId || !paymentDate || !amount || !paymentMethod) {
            return res.status(400).json({
                code: 0,
                message: 'Faltan campos obligatorios: invoiceId, paymentDate, amount y paymentMethod.'
            });
        }
        
        const invoiceExists = await Invoice.findByPk(invoiceId);
        if (!invoiceExists) {
            return res.status(404).json({
                code: 0,
                message: 'El ID de la factura proporcionado no existe.'
            });
        }

        const newPayment = await PaymentHistory.create({
            invoiceId,
            paymentDate,
            amount,
            paymentMethod,
            description
        });

        res.status(201).json({
            code: 1,
            message: 'Registro de pago creado exitosamente.',
            data: newPayment
        });

    } catch (error) {
        console.error(`[ERROR] [PaymentHistory] [postPaymentHistory]`, error);
        res.status(500).json({
            code: 0,
            message: 'Ha ocurrido un error inesperado. Intente nuevamente.'
        });
    }
};

/**
 * PUT (Update) an existing Payment History record
 * Endpoint: /api/paymentHistory/:id
 */
const updatePaymentHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const { invoiceId, paymentDate, amount, paymentMethod, description } = req.body;

        const payment = await PaymentHistory.findByPk(id);
        if (!payment) {
            return res.status(404).json({
                code: 0,
                message: 'Registro de pago no encontrado.'
            });
        }

        const dataToUpdate = {};
        if (invoiceId) {
            const invoiceExists = await Invoice.findByPk(invoiceId);
            if (!invoiceExists) {
                return res.status(404).json({
                    code: 0,
                    message: 'El ID de la factura proporcionado no existe.'
                });
            }
            dataToUpdate.invoiceId = invoiceId;
        }
        if (paymentDate) dataToUpdate.paymentDate = paymentDate;
        if (amount) dataToUpdate.amount = amount;
        if (paymentMethod) dataToUpdate.paymentMethod = paymentMethod;
        if (description) dataToUpdate.description = description;

        if (Object.keys(dataToUpdate).length === 0) {
            return res.status(400).json({
                code: 0,
                message: 'No se proporcionaron campos para actualizar.'
            });
        }

        await payment.update(dataToUpdate);

        res.status(200).json({
            code: 1,
            message: 'Registro de pago actualizado exitosamente.',
            data: payment
        });
    } catch (error) {
        console.error(`[ERROR] [PaymentHistory] [updatePaymentHistory]`, error);
        res.status(500).json({
            code: 0,
            message: 'Ha ocurrido un error inesperado. Intente nuevamente.'
        });
    }
};

/**
 * DELETE (Soft Delete) a Payment History record
 * Endpoint: /api/paymentHistory/:id
 */
const destroyPaymentHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await PaymentHistory.destroy({ where: { id } });

        if (!result) {
            return res.status(404).json({ code: 0, message: 'Registro de pago no encontrado.' });
        }

        res.status(200).json({
            code: 1,
            message: 'Registro de pago eliminado correctamente.'
        });
    } catch (error) {
        console.error(`[ERROR] [PaymentHistory] [destroyPaymentHistory]`, error);
        res.status(500).json({
            code: 0,
            message: 'Ha ocurrido un error inesperado. Intente nuevamente.'
        });
    }
};

/**
 * GET all soft-deleted Payment History records
 * Endpoint: /api/paymentHistory/deleted
 */
const getDeletedPaymentHistory = async (req, res) => {
    try {
        const deletedPayments = await PaymentHistory.findAll({
            paranoid: false,
            where: {
                deleted_at: {
                    [Op.ne]: null
                }
            },
            include: [{
                model: Invoice,
                as: 'invoice',
                attributes: ['id', 'name', 'rfc']
            }],
            attributes: ['id', 'invoiceId', 'paymentDate', 'amount', 'deleted_at']
        });

        res.status(200).json({
            code: 1,
            data: deletedPayments,
        });
    } catch (error) {
        console.error(`[ERROR] [PaymentHistory] [getDeletedPaymentHistory]`, error);
        res.status(500).json({
            code: 0,
            message: 'Ha ocurrido un error inesperado. Intente nuevamente.'
        });
    }
};

/**
 * PUT (Restore) a soft-deleted record
 * Endpoint: /api/paymentHistory/restore/:id
 */
const restorePaymentHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await PaymentHistory.restore({ where: { id } });

        if (!result) {
            return res.status(404).json({
                code: 0,
                message: 'Registro de pago no encontrado o ya está activo.'
            });
        }

        res.status(200).json({
            code: 1,
            message: 'Registro de pago restaurado exitosamente.'
        });
    } catch (error) {
        console.error(`[ERROR] [PaymentHistory] [restorePaymentHistory]`, error);
        res.status(500).json({
            code: 0,
            message: 'Ha ocurrido un error inesperado. Intente nuevamente.'
        });
    }
};

module.exports = {
    getPaymentHistory,
    getSinglePaymentHistory,
    postPaymentHistory,
    updatePaymentHistory,
    destroyPaymentHistory,
    getDeletedPaymentHistory,
    restorePaymentHistory
};