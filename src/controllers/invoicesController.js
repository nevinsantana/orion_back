// src/controllers/invoicesController.js

const { Invoice, Client } = require('../models');
const { ReminderCode, PaymentHistory, sequelize } = require('../models');
const { Op } = require('sequelize'); 
const fs = require('fs'); 
const path = require('path');
const os = require('os'); // Necesario para acceder a /tmp en Lambda
const multer = require('multer');
const { sendEmail } = require('../helpers/emailHelper');
const axios = require('axios');
// const soap = require('soap'); // Si no usas SOAP actualmente, podrías borrarlo, pero lo dejo por si acaso
const { buildCfdi40Xml, buildCfdi40Txt } = require('../helpers/cfdiBuilder');
const crypto = require('crypto');
const geminiService = require('../services/geminiService');

// 👇 IMPORTAMOS EL SERVICIO DE S3
const { uploadFile } = require('../services/s3Service');

// ⚠️ CONFIGURACIÓN MULTER: Usamos memoria (Buffer) en lugar de disco
const storage = multer.memoryStorage();

// Middlewares de carga
const invoiceAttachmentMiddleware = multer({ storage: storage }).single('invoiceAttachment');
const imageUploadMiddleware = multer({ storage: storage }).single('validationImage');

/**
 * HELPER: Descargar archivo de S3 a /tmp
 * Necesario porque Gemini espera una ruta de archivo físico ('path'),
 * y en Lambda solo podemos escribir en /tmp.
 */
const downloadFileToTemp = async (url, fileName) => {
    try {
        const tempPath = path.join(os.tmpdir(), fileName);
        const writer = fs.createWriteStream(tempPath);

        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream'
        });

        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => resolve(tempPath));
            writer.on('error', reject);
        });
    } catch (error) {
        throw new Error(`Error descargando archivo temporal para IA: ${error.message}`);
    }
};

/**
 * OBTENER FACTURA POR ID
 */
const getInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const invoice = await Invoice.findByPk(id, {
            attributes: { exclude: ['deleted_at'] }
        });

        if (!invoice) return res.status(404).json({ code: 0, message: 'Factura no encontrada.' });

        res.status(200).json({ code: 1, invoice });
    } catch (error) {
        console.error('Error al obtener factura:', error);
        res.status(500).json({ code: 0, error: 'Fallo al obtener la factura.' });
    }
};

/**
 * OBTENER TODAS LAS FACTURAS
 */
const getInvoices = async (req, res) => {
    try {
        const invoices = await Invoice.findAll({
            attributes: { exclude: ['deleted_at', 'updated_at'] }
        });
        res.status(200).json({ code: 1, invoices });
    } catch (error) {
        console.error('Error al obtener facturas:', error);
        res.status(500).json({ code: 0, error: 'Fallo al obtener las facturas.' });
    }
};

/**
 * CREAR FACTURA (Sube adjunto a S3)
 */
const postInvoice = async (req, res) => {
    try {
        const fileAttachment = req.file; 
        let invoiceData = req.body;
        
        // 1. Subir a S3 si hay archivo
        if (fileAttachment) {
            const timestamp = Date.now();
            const fileName = `invoice-${timestamp}-${fileAttachment.originalname}`;
            const s3Url = await uploadFile(fileName, fileAttachment.buffer, fileAttachment.mimetype);
            
            invoiceData.file = s3Url; // Guardamos la URL de S3
        } else {
             invoiceData.file = null;
        }

        // 2. Guardar en BD
        const newInvoice = await Invoice.create(invoiceData);

        res.status(201).json({ 
            code: 1, 
            message: 'Factura creada exitosamente', 
            invoice: newInvoice 
        });
    
    } catch (error) {
        console.error('Error al crear factura:', error);
        res.status(400).json({ code: 0, error: 'Fallo al crear la factura.' });
    }
};

/**
 * ACTUALIZAR FACTURA
 */
const updateInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const file = req.file; 
        let dataToUpdate = req.body;

        const invoice = await Invoice.findByPk(id);
        if (!invoice) return res.status(404).json({ code: 0, message: 'Factura no encontrada.' });

        // 1. Subir nuevo archivo a S3 si existe
        if (file) {
            const timestamp = Date.now();
            const fileName = `invoice-${timestamp}-${file.originalname}`;
            const s3Url = await uploadFile(fileName, file.buffer, file.mimetype);
            
            dataToUpdate.file = s3Url; 
        }

        // 2. Actualizar BD
        invoice.set(dataToUpdate);
        await invoice.save(); 

        res.status(200).json({ code: 1, message: 'Factura actualizada exitosamente' });
        
    } catch (error) {
        console.error('Error al actualizar factura:', error);
        res.status(500).json({ code: 0, error: 'Fallo al actualizar la factura.' });
    }
};

/**
 * ELIMINAR FACTURA (Soft Delete)
 */
const destroyInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await Invoice.destroy({ where: { id } });

        if (result === 0) return res.status(404).json({ code: 0, message: 'Factura no encontrada.' });

        res.status(200).json({ code: 1, message: 'Factura eliminada correctamente.' });
    } catch (error) {
        console.error('Error al eliminar factura:', error);
        res.status(500).json({ code: 0, error: 'Fallo al eliminar la factura.' });
    }
};

/**
 * RESTAURAR FACTURA
 */
const restoreInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await Invoice.restore({ where: { id } });

        if (result === 0) return res.status(404).json({ code: 0, message: 'Factura no encontrada o activa.' });

        res.status(200).json({ code: 1, message: 'Factura restaurada exitosamente.' });
    } catch (error) {
        console.error('Error al restaurar factura:', error);
        res.status(500).json({ code: 0, error: 'Fallo al restaurar la factura.' });
    }
};

/**
 * OBTENER ELIMINADAS
 */
const getDeletedInvoices = async (req, res) => {
    try {
        const deletedInvoices = await Invoice.findAll({
            paranoid: false, 
            where: { deleted_at: { [Op.not]: null } },
            attributes: { exclude: ['updated_at', 'created_at'] }
        });
        
        res.status(200).json({ code: 1, invoices: deletedInvoices });
    } catch (error) {
        console.error('Error al obtener eliminadas:', error);
        res.status(500).json({ code: 0, error: "Error inesperado." });
    }
};

/**
 * VALIDAR CÓDIGO Y SUBIR IMAGEN DE PAGO (S3)
 */
const validateCodeAndImage = async (req, res) => {
    const file = req.file; 
    const { code } = req.body;
    
    try {
        if (!code || !file) return res.status(400).json({ code: 0, message: 'Faltan datos.' });

        const reminderRecord = await ReminderCode.findOne({
            where: { code: code, used: false, deleted_at: { [Op.eq]: null } }
        });

        if (!reminderRecord) return res.status(404).json({ code: 0, message: 'Código inválido.' });
        
        // 1. Subir Imagen a S3
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        const fileName = `validation-${code}-${timestamp}${ext}`;
        const s3Url = await uploadFile(fileName, file.buffer, file.mimetype);

        // 2. Guardar URL en BD
        await reminderRecord.update({ used: true, image: s3Url });

        // 3. Notificación (Email)
        let invoice_info = await Invoice.findByPk(reminderRecord.id_invoice);
        /* const emailBody = `...HTML... <a href="${s3Url}">Ver Comprobante</a>`;
        await sendEmail('fresendiz@fabricadesoluciones.com', 'Comprobante Recibido', emailBody); 
        */

        res.status(200).json({
            code: 1,
            message: 'Validado exitosamente.',
            image_url: s3Url, 
            record: reminderRecord
        });

    } catch (error) {
        console.error('[ERROR] [validateCodeAndImage]', error);
        res.status(500).json({ code: 0, error: "Fallo en validación." });
    }
};

/**
 * OBTENER CÓDIGOS POR FACTURA
 */
const getCodesByInvoice = async (req, res) => {
    try {
        const { id } = req.params; 
        const codes = await ReminderCode.findAll({
            where: { id_invoice: id },
            attributes: ['id', 'code', 'used', 'image', 'created_at'] 
        });

        if (codes.length === 0) return res.status(404).json({ code: 0, message: `Sin códigos.` });

        res.status(200).json({ code: 1, count: codes.length, codes: codes });
    } catch (error) {
        res.status(500).json({ code: 0, error: "Fallo al obtener códigos." });
    }
};

/**
 * OBTENER TODOS LOS CÓDIGOS
 */
const getAllReminderCodes = async (req, res) => {
    try {
        const codes = await ReminderCode.findAll({
            order: [['id', 'DESC']],
            attributes: ['id', 'id_invoice', 'code', 'used', 'image', 'created_at'],
            include: [{
                model: Invoice,
                as: 'invoice', 
                attributes: ['id'], 
                required: true, 
                include: [{ model: Client, as: 'client', attributes: ['name'] }]
            }]
        });

        res.status(200).json({ code: 1, count: codes.length, codes: codes });
    } catch (error) {
        res.status(500).json({ code: 0, error: "Fallo al listar códigos." });
    }
};

const getReminderCodeById = async (req, res) => {
    try {
        const { id } = req.params; 
        const codeRecord = await ReminderCode.findByPk(id);

        if (!codeRecord) return res.status(404).json({ code: 0, message: 'No encontrado.' });

        res.status(200).json({ code: 1, code_record: codeRecord });
    } catch (error) {
        res.status(500).json({ code: 0, error: "Error al buscar código." });
    }
};

/**
 * VALIDAR PAGO CON IA (Soporte S3)
 */
const updatePaymentStatus = async (req, res) => {
    const { reminder_id, status } = req.body;
    const finalStatus = status?.toUpperCase();

    if (!reminder_id || (finalStatus !== 'ACEPTADO' && finalStatus !== 'RECHAZADO')) {
        return res.status(400).json({ code: 0, message: 'Datos inválidos.' });
    }

    let transaction;
    let tempFilePath = null;

    try {
        transaction = await sequelize.transaction();

        const reminderRecord = await ReminderCode.findByPk(reminder_id, { transaction });
        if (!reminderRecord) throw new Error('Código no encontrado.');
        
        const invoice = await Invoice.findByPk(reminderRecord.id_invoice, { transaction });
        if (!invoice) throw new Error('Factura no encontrada.');

        if (finalStatus === 'ACEPTADO') {
            const publicImageUrl = reminderRecord.image; // URL de S3
            if (!publicImageUrl) throw new Error('Sin imagen asociada.');

            // 1. Descargar imagen de S3 a /tmp para que Gemini la lea
            const fileName = path.basename(publicImageUrl);
            tempFilePath = await downloadFileToTemp(publicImageUrl, fileName);

            // 2. Analizar con Gemini
            const extractedAmount = await geminiService.analyzeImageAndExtractAmount(
                tempFilePath, // Ruta local temporal
                'image/jpeg', 
                fileName, 
                "Identifica el monto exacto."
            );

            // Limpieza inmediata
            if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);

            if (extractedAmount <= 0) {
                await transaction.rollback();
                return res.status(400).json({ code: 0, message: 'IA no detectó monto válido.' });
            }

            // 3. Registrar Pago
            await PaymentHistory.create({
                invoiceId: invoice.id,
                paymentDate: new Date(),
                amount: extractedAmount, 
                paymentMethod: 'IA/Comprobante',
                description: `Validado con código ${reminderRecord.code}`,
                confirmation_status: 'ÉXITO'
            }, { transaction });
            
            await invoice.update({ status: 'Pagada' }, { transaction });
            await reminderRecord.update({ used: true, completed_at: new Date() }, { transaction });
        } 

        await transaction.commit();
        res.status(200).json({ code: 1, message: `Factura marcada como ${finalStatus}.` });

    } catch (error) {
        if (transaction) await transaction.rollback();
        if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
        
        console.error('[ERROR] [updatePaymentStatus]', error);
        res.status(500).json({ code: 0, error: error.message || "Fallo en validación de pago." });
    }
};

/**
 * GENERAR TXT (CFDI)
 */
const generateInvoiceTxt = async (req, res) => {
    try {
        const { id } = req.params;
        const invoiceRecord = await Invoice.findByPk(id);

        if (!invoiceRecord) return res.status(404).json({ code: 0, message: 'No encontrada.' });
        
        const cfdiTxtString = buildCfdi40Txt(invoiceRecord.toJSON());

        res.status(200).json({ code: 1, message: 'TXT generado.', data: cfdiTxtString });
    } catch (error) {
        res.status(500).json({ code: 0, error: 'Fallo al generar TXT.' });
    }
};

module.exports = {
    getInvoices,
    getInvoice,
    postInvoice,
    updateInvoice,
    destroyInvoice,
    restoreInvoice,
    getDeletedInvoices,
    validateCodeAndImage,
    imageUploadMiddleware,
    getCodesByInvoice,
    updatePaymentStatus,
    getAllReminderCodes,
    getReminderCodeById,
    generateInvoiceTxt,
    invoiceAttachmentMiddleware
};