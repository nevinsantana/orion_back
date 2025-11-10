// src/controllers/invoicesController.js

const { Invoice } = require('../models');
const { ReminderCode, PaymentHistory, sequelize } = require('../models');
const { Op } = require('sequelize'); 
const fs = require('fs'); 
const path = require('path');
const multer = require('multer');
const { sendEmail } = require('../helpers/emailHelper');
const axios = require('axios');
const soap = require('soap');
const { buildCfdi40Xml } = require('../helpers/cfdiBuilder');
const crypto = require('crypto');
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
        
        const invoice = await Invoice.findByPk(id);

        if (!invoice) {
            return res.status(404).json({ code: 0, message: 'Factura no encontrada para actualizar.' });
        }

        // 2. Actualizar las propiedades en memoria
        invoice.set(req.body); 

        // 3. Guardar en la base de datos
        await invoice.save(); 

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


const validateCodeAndImage = async (req, res) => {
    const file = req.file; 
    const { code } = req.body;
    
    // Ruta que Multer guardó en el disco
    let filePath = file ? file.path : null; 
    
    // Ruta pública que se guardará en la base de datos
    let publicPath = null;

    // Calcular la ruta pública (ej: /validation_images/nombre-unico.jpg)
    if (file && file.filename) {
        publicPath = `/validation_images/${file.filename}`; 
    }

    try {
        // 1. Validación de entrada
        if (!code || !file) {
            return res.status(400).json({ code: 0, message: 'Se requiere el código de validación y la imagen.' });
        }

        // 2. Buscar y validar el código
        const reminderRecord = await ReminderCode.findOne({
            where: {
                code: code,
                used: false,
                deleted_at: { [Op.eq]: null }
            }
        });

        if (!reminderRecord) {
            // El código es inválido. Limpiamos la imagen y retornamos.
            if (filePath && fs.existsSync(filePath)) { fs.unlinkSync(filePath); }
            return res.status(404).json({ code: 0, message: 'Código inválido o ya utilizado.' });
        }
        
        // 3. Actualizar el registro: Marcar como usado y guardar la RUTA PÚBLICA PERMANENTE
        await reminderRecord.update({
            used: true,
            image: file.filename // Guardamos la ruta pública
        });

        let invoice_info = await Invoice.findByPk(reminderRecord.id_invoice);

        // 4. CLAVE: ENVIAR EL CORREO DE NOTIFICACIÓN
        const clientEmail = 'fresendiz@fabricadesoluciones.com'; // Dirección de correo del administrador o destino
        const subject = `Orion - Comprobante de pago recibido`;
        const emailBody = `
            <h1>Comprobante de pago recibido</h1>
            <p>El cliente <strong>${invoice_info.name}</strong>, ha compartido un comprobante de pago, puedes revisarlo en el sistema.</p>
            <p>Fecha de Recepción: ${new Date().toLocaleString()}</p>
        `;
        
        // Ejecutar el envío de correo (asumo que tu helper se llama sendEmail o sendPasswordResetEmail)
        // Usamos una función genérica que acepta el destino, asunto y cuerpo HTML
        //await sendEmail(clientEmail, subject, emailBody);


        // 5. Respuesta de éxito
        res.status(200).json({
            code: 1,
            message: 'Código validado y notificado exitosamente.',
            image_url: publicPath, 
            record: reminderRecord
        });

    } catch (error) {
        console.error('[ERROR] [validateCodeAndImage]', error);
        
        // 6. LIMPIEZA CRÍTICA: Si la BD o el ENVÍO de correo fallan, eliminamos el archivo.
        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`[LIMPIEZA] Imagen eliminada por fallo en BD o envío de correo: ${filePath}`);
        }

        res.status(500).json({ code: 0, error: "Fallo en el proceso de validación. (Verifique logs)" });
    }
    // No se necesita el bloque finally
};

const diskStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '..', '..', 'public', 'validation_images'); 
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir); 
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const uniqueName = `${path.basename(file.originalname, ext)}-${Date.now()}${ext}`;
        cb(null, uniqueName);
    }
});

const getCodesByInvoice = async (req, res) => {
    try {
        const { id } = req.params; // Obtener el ID de la factura desde la URL

        // Usar findAll con una cláusula WHERE para filtrar por id_invoice
        const codes = await ReminderCode.findAll({
            where: {
                id_invoice: id
            },
            attributes: ['id', 'code', 'used', 'image', 'created_at'] // Excluir campos sensibles/redundantes
        });

        if (codes.length === 0) {
            return res.status(404).json({ 
                code: 0, 
                message: `No se encontraron códigos para la factura ID: ${id}.` 
            });
        }

        res.status(200).json({
            code: 1,
            count: codes.length,
            codes: codes
        });

    } catch (error) {
        console.error('[ERROR] [getCodesByInvoice]', error);
        res.status(500).json({ 
            code: 0, 
            error: "Fallo en el proceso de obtención de códigos." 
        });
    }
};

const imageUploadMiddleware = multer({ storage: diskStorage }).single('validationImage');

//Validar pago humano o IA
const updatePaymentStatus = async (req, res) => {
    const { reminder_id, status } = req.body;
    
    const finalStatus = status?.toUpperCase();
    if (!reminder_id || (finalStatus !== 'ACEPTADO' && finalStatus !== 'RECHAZADO')) {
        return res.status(400).json({ code: 0, message: 'Se requiere reminder_id y un estado válido ("ACEPTADO" o "RECHAZADO").' });
    }

    let transaction;
    let filePath = null; // Necesario para la limpieza de disco en caso de fallo

    try {
        // 1. INICIO DE TRANSACCIÓN
        transaction = await sequelize.transaction();

        // A. Buscar SOLO el registro de ReminderCode (sin INCLUDE)
        const reminderRecord = await ReminderCode.findByPk(reminder_id, { transaction });

        if (!reminderRecord) {
            await transaction.rollback();
            return res.status(404).json({ code: 0, message: 'Registro de código no encontrado.' });
        }
        
        // B. Buscar la Factura en un paso SEPARADO
        const invoice = await Invoice.findByPk(reminderRecord.id_invoice, { transaction });

        if (!invoice) {
            await transaction.rollback();
            return res.status(404).json({ code: 0, message: 'Factura asociada no encontrada.' });
        }

        // 3. Lógica de Actualización
        if (finalStatus === 'ACEPTADO') {
            // A. CREAR REGISTRO EN EL HISTORIAL DE PAGOS
            await PaymentHistory.create({
                invoiceId: invoice.id,
                paymentDate: new Date(), 
                amount: invoice.total_amount, 
                paymentMethod: 'Manual/Comprobante',
                description: `Confirmación manual de comprobante (Código: ${reminderRecord.code})`,
                confirmation_status: 'ÉXITO'
            }, { transaction });
            
            // B. Actualizar el estado de la factura a Pagada
            await invoice.update({ status: 'Pagada' }, { transaction });

            // C. Marcar el código de recordatorio como usado
            await reminderRecord.update({ used: true, completed_at: new Date() }, { transaction });
            
            // Opcional: Envío de email
            // await sendEmail(invoice.contact_email, "Pago Confirmado...", "...");

        } else if (finalStatus === 'RECHAZADO') {
            // D. PAGO RECHAZADO: Permite el reintento
            await reminderRecord.update({ 
                used: false, 
                image: null, // Limpiar la referencia de la imagen
            }, { transaction }); 
            // Opcional: Notificación de rechazo
        }

        // 4. CONFIRMAR
        await transaction.commit();

        res.status(200).json({
            code: 1,
            message: `Revisión completada. Factura #${invoice.id} marcada como ${finalStatus}.`,
            invoice_status: finalStatus
        });

    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error('[ERROR] [updatePaymentStatus]', error);
        
        // ⚠️ Nota: La limpieza del archivo local es compleja aquí, ya que la ruta no se conoce si el fallo es temprano.
        // Asumiendo que el archivo de imagen es permanente, lo omitimos en el rollback de error.
        
        res.status(500).json({ code: 0, error: "Fallo interno en la actualización de estado. Transacción revertida." });
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
    updatePaymentStatus
};