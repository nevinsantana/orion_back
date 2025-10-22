const cron = require("node-cron");
const paymentFollowUpService = require("./paymentFollowUpService");
const { sendPaymentReminderEmail } = require("../helpers/emailHelper");
const { ReminderCode, sequelize } = require("../models"); // Importamos sequelize para la desconexión
const { UniqueConstraintError } = require("sequelize");

/**
 * Función para generar e insertar el código de recordatorio en la BD.
 */
const createReminderCode = async (invoice) => {
  // 1. Verificamos si ya existe un código PENDIENTE para esta factura
  const existingCode = await ReminderCode.findOne({
    where: {
      id_invoice: invoice.id,
      status: "PENDING",
    },
  });

  if (existingCode) {
    // Si existe un código PENDIENTE, lo reutilizamos.
    return existingCode;
  }

  // 2. Si no existe, generamos un código único
  const newCode = `RAK-${invoice.id}-${Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase()}`;

  try {
    const codeRecord = await ReminderCode.create({
      id_invoice: invoice.id,
      code: newCode,
      used: false,
      status: "PENDING",
    });
    return codeRecord;
  } catch (e) {
    // MEJORA #2: Manejo explícito del error de unicidad (si dos cronjobs corren a la vez)
    if (e instanceof UniqueConstraintError) {
      console.warn(
        `[CRONJOB] La Factura ID ${invoice.id} ya tuvo un código generado por un proceso paralelo. Reintentando búsqueda.`
      );
      // Si el error es por unicidad, volvemos a buscar el código que se acaba de crear
      return ReminderCode.findOne({ where: { id_invoice: invoice.id } });
    }
    console.error(
      `[CRONJOB] Falló al crear ReminderCode para Invoice ID ${invoice.id}:`,
      e.message
    );
    return null;
  }
};

/**
 * Función que define y arranca todos los cronjobs del proyecto.
 */
const startScheduler = () => {
  // Programamos el cronjob para que se ejecute todos los días a las 8:00 AM.
  cron.schedule("0 8 * * *", async () => {
    console.log(
      "[CRONJOB] Iniciando tarea de envío de recordatorios de pago..."
    );

    try {
      const portfolio = await paymentFollowUpService.getFollowUpPortfolio();

      const remindersToSend = portfolio.filter(
        (invoice) =>
          invoice.status === "Por Vencer (7 días)" ||
          invoice.status === "Vencida"
      );

      console.log(
        `[CRONJOB] Encontradas ${remindersToSend.length} facturas que requieren aviso.`
      );

      for (const invoice of remindersToSend) {
        // MEJORA #4: Verificación de correo
        const clientEmail =
          invoice.client?.contact_email || invoice.email_recepcion_facturas;
        if (!clientEmail) {
          console.warn(
            `[CRONJOB] Saltando Factura ID ${invoice.id}. No se encontró correo de contacto.`
          );
          continue; // Pasa a la siguiente factura
        }

        const codeRecord = await createReminderCode(invoice);

        if (codeRecord) {
          await sendPaymentReminderEmail({
            invoice,
            clientEmail: clientEmail, // Usamos el correo validado
            reminderCode: codeRecord.code,
            clientName: invoice.client.name,
            status: invoice.status,
          });
          console.log(
            `[CRONJOB] Recordatorio enviado para Factura ID ${invoice.id} a ${clientEmail}`
          );
        }
      }

      console.log("[CRONJOB] Tarea de recordatorios finalizada exitosamente.");
    } catch (error) {
      console.error("[CRONJOB] ERROR FATAL al procesar recordatorios:", error);
    } finally {
      // MEJORA #1: Desconexión de la base de datos
      if (sequelize.connectionManager.close) {
        await sequelize.connectionManager.close();
        console.log("[CRONJOB] Conexión a la BD liberada.");
      }
    }
  });
};

module.exports = {
  startScheduler,
  createReminderCode,
};
