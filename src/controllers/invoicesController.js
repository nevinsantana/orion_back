// src/controllers/invoicesController.js

const { Invoice, Client } = require('../models');
const { ReminderCode, PaymentHistory, sequelize } = require('../models');
const { Op } = require('sequelize'); 
const fs = require('fs'); 
const path = require('path');
const multer = require('multer');
const { sendEmail } = require('../helpers/emailHelper');
const axios = require('axios');
const soap = require('soap');
const { buildCfdi40Xml, buildCfdi40Txt } = require('../helpers/cfdiBuilder');
const crypto = require('crypto');
const geminiService = require('../services/geminiService');

const INVOICE_ATTACHMENT_DIR = path.join(__dirname, '..', '..', 'public', 'invoices');
const invoiceDiskStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (!fs.existsSync(INVOICE_ATTACHMENT_DIR)) {
            fs.mkdirSync(INVOICE_ATTACHMENT_DIR, { recursive: true });
        }
        cb(null, INVOICE_ATTACHMENT_DIR);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `invoice-${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`);
    }
});

// ⚠️ MIDDLEWARE NUEVO: Espera el campo 'invoiceAttachment'
const invoiceAttachmentMiddleware = multer({ storage: invoiceDiskStorage }).single('invoiceAttachment');
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
    // Si la subida de Multer fue exitosa, req.file.path tiene la ruta de disco.
    const filePath = req.file ? req.file.path : null; 
    try {
        const fileAttachment = req.file; 
        let invoiceData = req.body;
        
        // 1. Lógica de Subida Opcional: Adjuntar la URL pública
        if (fileAttachment) {
            const publicPath = `/invoices/${fileAttachment.filename}`;
            
            // ✅ CORRECCIÓN: Usar el nombre de columna 'file'
            invoiceData.file = fileAttachment.filename; 
        } else {
             // Si no hay archivo, asegúrate de que la columna reciba NULL
             invoiceData.file = null;
        }

        // 2. Crear el nuevo registro en la base de datos
        const newInvoice = await Invoice.create(invoiceData);

        // 3. Éxito: El archivo ya está guardado permanentemente
        res.status(201).json({ 
            code: 1, 
            message: 'Factura creada exitosamente', 
            invoice: newInvoice 
        });
    
    } catch (error) {
        console.error('Error al crear factura:', error);
        
        // 4. LIMPIEZA CRÍTICA: Eliminar el archivo del disco si la inserción en DB falla
        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath); 
        }
        
        // Manejo de errores
        res.status(400).json({ code: 0, error: 'Fallo al crear la factura.' });
    }
};

const updateInvoice = async (req, res) => {
    // 1. Obtener la ruta temporal del nuevo archivo para limpieza en caso de fallo
    const newFilePath = req.file ? req.file.path : null; 
    
    try {
        const { id } = req.params;
        const file = req.file; // Archivo subido por Multer (opcional)
        let dataToUpdate = req.body; // Datos de texto/formulario

        // 2. Buscar el registro de la factura
        const invoice = await Invoice.findByPk(id);

        if (!invoice) {
            return res.status(404).json({ code: 0, message: 'Factura no encontrada para actualizar.' });
        }

        // 3. LÓGICA DE ARCHIVO ADJUNTO (Actualización Opcional)
        if (file) {
            // A. Construir la ruta pública
            const publicPath = `/invoices/${file.filename}`;
            
            // B. Guardar la nueva ruta en los datos a actualizar
            dataToUpdate.file = file.filename; 

            // C. Limpieza del archivo antiguo (Si ya existía un adjunto)
            if (invoice.file) {
                // Generar la ruta absoluta del archivo antiguo
                const oldDiskPath = path.join(__dirname, '..', '..', 'public', invoice.file);
                
                if (fs.existsSync(oldDiskPath)) {
                    fs.unlinkSync(oldDiskPath); // Eliminar el archivo antiguo del disco
                    console.log(`[LIMPIEZA] Archivo adjunto antiguo eliminado: ${invoice.file}`);
                }
            }
        }
        // Nota: Si el usuario envía un archivo, Multer ya lo guardó en disco.
        

        // 4. Actualizar las propiedades en memoria y guardar en DB
        invoice.set(dataToUpdate);
        await invoice.save(); 

        res.status(200).json({ code: 1, message: 'Factura actualizada exitosamente' });
        
    } catch (error) {
        console.error('Error al actualizar factura:', error);
        
        // 5. LIMPIEZA CRÍTICA: Si la BD falla, eliminar el archivo nuevo subido
        if (newFilePath && fs.existsSync(newFilePath)) {
            fs.unlinkSync(newFilePath);
            console.log(`[LIMPIEZA] Archivo subido (temporal) eliminado por fallo de DB.`);
        }
        
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
        const publicImagePath = reminderRecord.image;
        // 3. Lógica de Actualización
        if (finalStatus === 'ACEPTADO') {
            const imageDiskPath = path.join(__dirname, '..', '..', 'public/validation_images', publicImagePath); 

            // 2. Validar que la imagen aún exista en el disco
            if (!fs.existsSync(imageDiskPath)) {
                await transaction.rollback();
                return res.status(404).json({ code: 0, message: 'El comprobante de imagen no se encuentra en el servidor.' });
            }

            const extractedAmount = await geminiService.analyzeImageAndExtractAmount(
                imageDiskPath, // <--- RUTA DE DISCO FINAL
                'image/jpeg',  // <--- Asumimos un mimeType genérico para la IA
                path.basename(imageDiskPath), // Usamos el nombre del archivo
                "Identifica el monto exacto de este comprobante."
            );

            // 2. Validación CRÍTICA: Asegurar que la IA devolvió un monto válido (> 0)
            if (extractedAmount <= 0) {
                // Si la IA no encontró el monto, cancelamos la transacción y avisamos al usuario.
                // Esto previene que se registren pagos de $0.00.
                await transaction.rollback();
                // Limpieza de disco si es necesario (ya que el archivo fue subido)
                if (filePath && fs.existsSync(filePath)) { fs.unlinkSync(filePath); }

                return res.status(400).json({
                    code: 0,
                    message: 'Validación fallida: No se pudo extraer un monto de pago válido del comprobante. Revise el formato de la imagen.',
                });
            }

            // 3. CREAR REGISTRO EN EL HISTORIAL DE PAGOS con el monto de la IA
            await PaymentHistory.create({
                invoiceId: invoice.id,
                paymentDate: new Date(),
                // ✅ CLAVE: Usar el monto extraído de la IA
                amount: extractedAmount, 
                paymentMethod: 'IA/Comprobante Digital',
                description: `Comprobante validado con código ${reminderRecord.code}. Monto extraído: ${extractedAmount}`,
                confirmation_status: 'ÉXITO'
            }, { transaction });
            
            // B. Actualizar el estado de la factura a Pagada
            await invoice.update({ status: 'Pagada' }, { transaction });

            // C. Marcar el código de recordatorio como usado
            await reminderRecord.update({ used: true, completed_at: new Date() }, { transaction });
            
            

        } else if (finalStatus === 'RECHAZADO') {
            // D. PAGO RECHAZADO: Permite el reintento
            // await reminderRecord.update({ 
            //     used: false, 
            //     image: null, // Limpiar la referencia de la imagen
            // }, { transaction }); 
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


const getAllReminderCodes = async (req, res) => {
    try {
        const codes = await ReminderCode.findAll({
            // 1. Ordenar por 'id' en orden descendente (DESC)
            order: [
                ['id', 'DESC']
            ],
            // 2. Seleccionar solo los campos relevantes del ReminderCode
            attributes: [
                'id', 
                'id_invoice', 
                'code', 
                'used', 
                'image', 
                'created_at'
            ],
            // 3. INCLUSIÓN ANIDADA
            include: [{
                model: Invoice,
                as: 'invoice', // Alias de ReminderCode a Invoice (confirmado previamente)
                attributes: ['id'], // Solo necesitamos el ID de la factura (o los que necesites)
                required: true, // Opcional: Solo trae códigos que SÍ tienen factura
                
                // INCLUSIÓN ANIDADA: Obtener el Cliente de la Factura
                include: [{
                    // ✅ Asegúrate de que este sea el nombre de tu modelo Client
                    model: Client, 
                    // ✅ Asegúrate de que este sea el alias definido en Invoice.belongsTo(Client)
                    as: 'client', 
                    // ✅ Selecciona solo el nombre del cliente
                    attributes: ['name'] 
                }]
            }]
        });

        res.status(200).json({
            code: 1,
            count: codes.length,
            message: "Códigos de recordatorio obtenidos exitosamente.",
            codes: codes
        });

    } catch (error) {
        console.error('[ERROR] [getAllReminderCodes]', error);
        res.status(500).json({ 
            code: 0, 
            error: "Fallo al obtener la lista de códigos de recordatorio." 
        });
    }
};

const getReminderCodeById = async (req, res) => {
    try {
        // 1. Obtener el ID de la ruta
        const { id } = req.params; 

        // 2. Buscar por ID primario
        const codeRecord = await ReminderCode.findByPk(id, {
            attributes: [
                'id', 
                'id_invoice', 
                'code', 
                'used', 
                'image', 
                'created_at'
            ]
        });

        if (!codeRecord) {
            return res.status(404).json({ code: 0, message: 'Código de recordatorio no encontrado.' });
        }

        res.status(200).json({
            code: 1,
            message: "Código de recordatorio obtenido exitosamente.",
            code_record: codeRecord
        });

    } catch (error) {
        console.error('[ERROR] [getReminderCodeById]', error);
        res.status(500).json({ 
            code: 0, 
            error: "Fallo al obtener el código de recordatorio." 
        });
    }
};

const generateInvoiceTxt = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Buscar la factura por ID en la DB
        const invoiceRecord = await Invoice.findByPk(id);

        if (!invoiceRecord) {
            return res.status(404).json({
                code: 0,
                message: `Factura ID ${id} no encontrada.`
            });
        }
        
        // Convertir el objeto Sequelize a JSON simple para el helper
        const invoiceData = invoiceRecord.toJSON(); 

        // 2. Generar la cadena de texto plano TXT
        const cfdiTxtString = buildCfdi40Txt(invoiceData);

        // 3. Devolver la respuesta (puedes devolver el texto puro para depuración)
        res.status(200).json({
            code: 1,
            message: `TXT CFDI 4.0 generado para Factura ID ${id}.`,
            data: cfdiTxtString
        });

    } catch (error) {
        console.error('Error al generar TXT de factura:', error);
        res.status(500).json({
            code: 0,
            error: error.message || 'Fallo interno al generar el archivo TXT.'
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