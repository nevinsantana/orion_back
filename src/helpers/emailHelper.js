const nodemailer = require("nodemailer");

// --- TRANSPORTER: Configuración Global de Nodemailer ---
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  logger: false,
  debug: false,
});

/**
 * Envía el correo de restablecimiento de contraseña.
 */
const sendPasswordResetEmail = async (userEmail, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/forgot-password?token=${resetToken}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: userEmail,
    subject: "Recuperación de Contraseña",
    html: `
            <h1>Recuperación de Contraseña</h1>
            <p>Hola,</p>
            <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.</p>
            <p>Para continuar, haz clic en el siguiente enlace:</p>
            <a href="${resetUrl}">Restablecer Contraseña</a>
            <p>Si no solicitaste un restablecimiento de contraseña, por favor, ignora este correo.</p>
        `,
  };
  try {
    await transporter.sendMail(mailOptions);
    console.log(`Correo de recuperación enviado a ${userEmail}`);
  } catch (error) {
    console.error("Error al enviar el correo:", error);
    throw new Error("Error al enviar el correo de recuperación.");
  }
};

/**
 * Envía un correo de recordatorio de pago con un código de confirmación.
 * Esta es la función usada por el Cronjob.
 */
const sendPaymentReminderEmail = async ({
  invoice,
  clientEmail,
  reminderCode,
  clientName,
  status,
}) => {
  // URL que el cliente usará para subir el comprobante
  const confirmationUrl = `${process.env.FRONTEND_URL}/confirm-payment?code=${reminderCode}`;

  // Formateo de fecha y monto
  const dueDateFormatted = new Date(invoice.due_date).toLocaleDateString(
    "es-MX",
    { year: "numeric", month: "long", day: "numeric" }
  );
  const amountFormatted = parseFloat(invoice.total_amount).toLocaleString(
    "es-MX",
    { style: "currency", currency: "MXN" }
  );

  // Determinar el tono del mensaje (Vencida o Próxima a Vencer)
  let subject = `Aviso Importante: Factura ${invoice.id} Próxima a Vencer`;
  let urgencyMessage = `Tu factura por ${amountFormatted} vence el ${dueDateFormatted}. Te recordamos realizar tu pago para evitar cargos por mora.`;

  if (status === "Vencida") {
    subject = `URGENTE: Factura ${invoice.id} Vencida - Acción Requerida`;
    urgencyMessage = `**TU FACTURA HA VENCIDO.** Por favor, realiza el pago de ${amountFormatted} de inmediato. Evita la suspensión de servicios y cargos moratorios.`;
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: clientEmail,
    subject: subject,
    html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2 style="color: #0d47a1;">Recordatorio de Pago de Factura</h2>
                
                <!-- CORRECCIÓN FINAL: Solo se usa el nombre del cliente -->
                <p>Estimado(a) **${clientName}**:</p> 

                <p>Este es un recordatorio automático sobre una factura pendiente con **RAK Orion**.</p>
                
                <h3 style="color: ${
                  status === "Vencida" ? "#c62828" : "#ffb300"
                };">${urgencyMessage}</h3>
                
                <hr style="border: 0; border-top: 1px solid #eee;">

                <p><strong>Detalles de la Factura:</strong></p>
                <ul>
                    <li><strong>ID de Factura:</strong> #${invoice.id}</li>
                    <li><strong>Monto Total:</strong> ${amountFormatted}</li>
                    <li><strong>Fecha de Vencimiento:</strong> ${dueDateFormatted}</li>
                </ul>

                <h3 style="color: #0d47a1;">Confirmación de Pago (¡Paso Importante!)</h3>
                <p>Una vez realizado tu pago, por favor utiliza tu **Código de Comprobante Único** para subir tu recibo:</p>
                
                <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; text-align: center;">
                    <p style="font-size: 18px; margin: 0;">Tu Código de Comprobante es:</p>
                    <p style="font-size: 24px; font-weight: bold; color: #0d47a1; margin-top: 5px;">${reminderCode}</p>
                </div>

                <p style="margin-top: 20px;">Haz clic en el siguiente botón o enlace para subir tu comprobante de pago:</p>
                
                <a href="${confirmationUrl}" style="background-color: #0d47a1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Subir Comprobante Ahora</a>
                
                <p style="margin-top: 20px;"><small>Enlace directo: <a href="${confirmationUrl}">${confirmationUrl}</a></small></p>

                <p>Gracias por tu pronta atención.</p>
                <p>Atentamente,<br>El Equipo de RAK Orion</p>
            </div>
        `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error(
      `[EMAIL ERROR] Error al enviar recordatorio a ${clientEmail} para Factura ID ${invoice.id}:`,
      error
    );
    throw new Error("Error al enviar el correo de recordatorio.");
  }
};

const sendEmail = async (toEmail, subject, htmlBody) => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: toEmail,
    subject: subject,
    html: htmlBody,
  });
};

module.exports = { sendPasswordResetEmail, sendPaymentReminderEmail, sendEmail };
