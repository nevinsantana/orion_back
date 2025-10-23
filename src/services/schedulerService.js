const cron = require('node-cron');
const paymentFollowUpService = require('./paymentFollowUpService');
const { sendPaymentReminderEmail } = require('../helpers/emailHelper');
const { ReminderCode } = require('../models');
const { UniqueConstraintError } = require('sequelize');

// Obtenemos la expresión cron del .env, con un valor por defecto seguro (8:00 AM)
const CRON_EXPRESSION = process.env.CRON_PAYMENT_SCHEDULE || '0 8 * * *';

/**
 * Función para generar e insertar el código de recordatorio en la BD.
 */
const createReminderCode = async (invoice) => {
    
    // 1. Verificamos si ya existe un código PENDIENTE para esta factura
    const existingCode = await ReminderCode.findOne({
        where: { 
            id_invoice: invoice.id,
            used: false 
        }
    });

    if (existingCode) {
        return existingCode;
    }
    
    // 2. Si no existe, generamos un código único
    const newCode = `RAK-${invoice.id}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    try {
        const codeRecord = await ReminderCode.create({
            id_invoice: invoice.id,
            code: newCode,
            used: false
        });
        return codeRecord;
    } catch (e) {
        if (e instanceof UniqueConstraintError) {
             console.warn(`[CRONJOB] La Factura ID ${invoice.id} ya tuvo un código generado por un proceso paralelo. Reintentando búsqueda.`);
             return ReminderCode.findOne({ where: { id_invoice: invoice.id } });
        }
        console.error(`[CRONJOB] Falló al crear ReminderCode para Invoice ID ${invoice.id}:`, e.message);
        return null;
    }
}

/**
 * Función que define y arranca todos los cronjobs del proyecto.
 */
const startScheduler = () => {
    
    console.log(`[CRONJOB] Programando recordatorios con la expresión: ${CRON_EXPRESSION}`);
    
    // Usamos la variable de entorno CRON_EXPRESSION
    cron.schedule(CRON_EXPRESSION, async () => { 
        console.log('[CRONJOB] Iniciando tarea de envío de recordatorios de pago...');
        
        try {
            const portfolio = await paymentFollowUpService.getFollowUpPortfolio();
            
            const remindersToSend = portfolio.filter(invoice => 
                (invoice.status === 'Por Vencer (7 días)' || invoice.status === 'Vencida') 
            );

            console.log(`[CRONJOB] Encontradas ${remindersToSend.length} facturas que requieren aviso.`);

            for (const invoice of remindersToSend) {
                const clientEmail = invoice.client?.contact_email || invoice.email_recepcion_facturas;
                if (!clientEmail) {
                    console.warn(`[CRONJOB] Saltando Factura ID ${invoice.id}. No se encontró correo de contacto.`);
                    continue;
                }

                const codeRecord = await createReminderCode(invoice);
                
                if (codeRecord) {
                    await sendPaymentReminderEmail({
                        invoice,
                        clientEmail: clientEmail,
                        reminderCode: codeRecord.code,
                        clientName: invoice.client.name,
                        status: invoice.status
                    });
                    console.log(`[CRONJOB] Recordatorio enviado para Factura ID ${invoice.id} a ${clientEmail}`);
                }
            }

            console.log('[CRONJOB] Tarea de recordatorios finalizada exitosamente.');

        } catch (error) {
            console.error('[CRONJOB] ERROR FATAL al procesar recordatorios:', error);
        }
    });
};

module.exports = {
    startScheduler,
    createReminderCode
};
