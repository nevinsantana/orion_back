// src/controllers/invoicesController.js

const { Invoice } = require('../models');
const { ReminderCode } = require('../models');
const { Op } = require('sequelize'); 
const fs = require('fs'); 
const path = require('path');
const multer = require('multer');
const { sendEmail } = require('../helpers/emailHelper');
const axios = require('axios');
const soap = require('soap');
const { buildCfdi40Xml } = require('../helpers/cfdiBuilder');
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
            image: publicPath // Guardamos la ruta pública
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
        await sendEmail(clientEmail, subject, emailBody);


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

// --- Configuración cargada del .env ---
const USUARIO_SF = process.env.SF_TEST_USERNAME;
const PASSWORD_SF = process.env.SF_TEST_PASSWORD;
// URL WSDL de Solución Factible
const URL_WSDL = process.env.SF_API_URL_SANDBOX || 'https://testing.solucionfactible.com/ws/services/Timbrado?wsdl';
/**
 * @param {string} cfdiXmlString - La cadena XML del CFDI 4.0 lista para ser codificada.
 */
const timbrarCfdi = (cfdiXmlString) => {
    
    // 1. Validar que la cadena XML exista
    if (!cfdiXmlString || typeof cfdiXmlString !== 'string' || cfdiXmlString.length === 0) {
        throw new Error("Se requiere la cadena XML del CFDI para el timbrado.");
    }

    // 2. Codificar el XML a Base64
    const cfdiBase64 = Buffer.from(cfdiXmlString, 'utf-8').toString('base64');
    
    // 3. Argumentos para la llamada SOAP
    const args = {
        usuario: USUARIO_SF,
        password: PASSWORD_SF,
        cfdi: cfdiBase64,
        zip: false
    };

    // 4. Llamada al Cliente SOAP (Promesa)
    return new Promise((resolve, reject) => {
        
        soap.createClient(URL_WSDL, function(err, client) {
            if (err) {
                console.error("Error al crear el cliente SOAP:", err);
                return reject(new Error("No se pudo conectar al WSDL de Solución Factible."));
            }

            // Llamamos a la operación 'timbrar'
            client.timbrar(args, function(err, result) {
                if (err) {
                    console.error("Error en la llamada a timbrar:", err);
                    return reject(new Error("Error de red o SOAP."));
                }
                
                // 5. Procesar el Resultado
                const ret = result.return;
                
                if (ret.status == 200) {
                    // Timbrado exitoso
                    console.log(`Timbrado exitoso. UUID: ${ret.resultados[0].uuid}`);
                    resolve(ret.resultados[0]);
                } else {
                    // Error reportado por Solución Factible
                    console.error(`Error de Timbrado [${ret.status}]: ${ret.mensaje}`);
                    reject(new Error(`Error de timbrado: ${ret.mensaje}`));
                }
            });
        });
    });
};

const timbrar = async (req, res) => {
    try {
        // 1. Obtener la factura de prueba de la base de datos
        // Usaremos el ID 1 como ejemplo
        const invoiceRecord = await Invoice.findByPk(1); 

        if (!invoiceRecord) {
            return res.status(404).json({
                code: 0,
                message: 'Error: Factura de prueba ID 1 no encontrada en la base de datos.'
            });
        }
        
        // 2. Convertir el objeto Sequelize a un objeto JSON simple para el helper
        const invoiceData = invoiceRecord.toJSON(); 

        // 3. Generar la cadena XML completa del CFDI 4.0
        const cfdiXmlString = buildCfdi40Xml(invoiceData); 

        // 4. Llamar al servicio de timbrado (SOAP)
        const resultadoTimbrado = await timbrarCfdi(cfdiXmlString);

        // 5. Devolver la respuesta
        res.status(200).json({
            code: 1,
            message: 'Timbrado de factura solicitado exitosamente.',
            data: resultadoTimbrado
        });

    } catch (error) {
        console.error('Error en el proceso de Timbrado:', error);
        res.status(500).json({
            code: 0,
            error: error.message || 'Fallo interno en el timbrado de la factura.'
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
    timbrar
};