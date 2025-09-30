// src/helpers/emailHelper.js
const nodemailer = require('nodemailer');

// const transporter = nodemailer.createTransport({
//     host: process.env.EMAIL_HOST,
//     port: process.env.EMAIL_PORT,
//     secure: false,
//     auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS,
//     },
//     logger: true, 
//     debug: true
// });
//https://ethereal.email Crea una cuenta y simula el envio de correo, no los manda pero en la misma pagina puedes ver lo que mandaron
const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'emmalee.hermann@ethereal.email',
        pass: '5hZrVK6EDMWxqZpXcu'
    }
});

const sendPasswordResetEmail = async (userEmail, resetToken) => {
    const resetUrl = `${process.env.FRONTEND_URL}/forgot-password?token=${resetToken}`;
     
    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: userEmail,
        subject: 'Recuperación de Contraseña',
        html: `
            <h1>Recuperación de Contraseña</h1>
            <p>Hola,</p>
            <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.</p>
            <p>Para continuar, haz clic en el siguiente enlace:</p>
            <a href="${resetUrl}">Restablecer Contraseña</a>
            <p>Si no solicitaste un restablecimiento de contraseña, por favor, ignora este correo.</p>
        `
    };
    //console.log(mailOptions.html);
    try {
        await transporter.sendMail(mailOptions);
        console.log(`Correo de recuperación enviado a ${userEmail}`);
    } catch (error) {
        console.error('Error al enviar el correo:', error);
        throw new Error('Error al enviar el correo de recuperación.');
    }
};

module.exports = { sendPasswordResetEmail };