// src/controllers/invoicesController.js

const { Invoice } = require('../models');
const { Op } = require('sequelize'); 
// ... otras funciones ...

/**
 * GET Invoice by ID
 */
const getInvoice = async (req, res) => {
    try {
        const { id } = req.params;

        const invoice = await Invoice.findByPk(id, {
            // Excluir campos de sistema en la respuesta
            attributes: { exclude: ['deleted_at'] }
        });

        if (!invoice) {
            return res.status(404).json({ code: 0, message: 'Factura no encontrada.' });
        }

        res.status(200).json({ code: 1, invoice });
    } catch (error) {
        console.error('Error al obtener factura por ID:', error);
        res.status(500).json({ code: 0, error: 'Fallo al obtener la factura.' });
    }
};

const getInvoices = async (req, res) => {
    try {
        const invoices = await Invoice.findAll({
            attributes: { exclude: ['deleted_at', 'updated_at'] } // Excluye campos de sistema para limpieza
        });
        res.status(200).json({ code: 1, invoices });
    } catch (error) {
        console.error('Error al obtener facturas:', error);
        res.status(500).json({ code: 0, error: 'Fallo al obtener las facturas.' });
    }
};

const postInvoice = async (req, res) => {
    try {
        const newInvoice = await Invoice.create(req.body);
        res.status(201).json({ code: 1, message: 'Factura creada exitosamente', invoice: newInvoice });
    } catch (error) {
        console.error('Error al crear factura:', error);
        // Manejo básico de errores de validación/unicidad
        res.status(400).json({ code: 0, error: 'Fallo al crear la factura.' });
    }
};

const updateInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const [updatedRows] = await Invoice.update(req.body, {
            where: { id },
            returning: true // Devuelve los registros actualizados (PostgreSQL, pero buena práctica)
        });

        if (updatedRows === 0) {
            return res.status(404).json({ code: 0, message: 'Factura no encontrada para actualizar.' });
        }

        res.status(200).json({ code: 1, message: 'Factura actualizada exitosamente' });
    } catch (error) {
        console.error('Error al actualizar factura:', error);
        res.status(500).json({ code: 0, error: 'Fallo al actualizar la factura.' });
    }
};

const destroyInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await Invoice.destroy({ where: { id } });

        if (result === 0) {
            return res.status(404).json({ code: 0, message: 'Factura no encontrada para eliminar.' });
        }

        res.status(200).json({ code: 1, message: 'Factura eliminada correctamente.' });
    } catch (error) {
        console.error('Error al eliminar factura:', error);
        res.status(500).json({ code: 0, error: 'Fallo al eliminar la factura.' });
    }
};

const restoreInvoice = async (req, res) => {
    try {
        const { id } = req.params;

        // El método restore() busca el ID y establece deleted_at a NULL.
        const result = await Invoice.restore({
            where: { id }
        });

        if (result === 0) {
            return res.status(404).json({
                code: 0,
                message: 'Factura no encontrada o ya está activa.'
            });
        }

        res.status(200).json({
            code: 1,
            message: 'Factura restaurada exitosamente.'
        });

    } catch (error) {
        console.error('Error al restaurar factura:', error);
        res.status(500).json({ code: 0, error: 'Fallo al restaurar la factura.' });
    }
};

const getDeletedInvoices = async (req, res) => {
    try {
        const deletedInvoices = await Invoice.findAll({
            paranoid: false, 
            where: {
                deleted_at: {
                    [Op.not]: null // <--- ¡CAMBIAR A Op.not! Esto es más robusto para IS NOT NULL
                }
            },
            attributes: { exclude: ['updated_at', 'created_at'] }
        });
        
        res.status(200).json({
            code: 1,
            invoices: deletedInvoices,
        });
    } catch (error) {
        console.error('Error al obtener facturas eliminadas:', error);
        res.status(500).json({
            code: 0,
            error: "Ha ocurrido un error inesperado. Intente nuevamente."
        });
    }
};

module.exports = {
    getInvoices,
    getInvoice,
    postInvoice,
    updateInvoice,
    destroyInvoice,
    restoreInvoice,
    getDeletedInvoices
};