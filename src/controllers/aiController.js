// src/controllers/aiController.js

const geminiService = require('../services/geminiService');
const multer = require('multer');
const fs = require('fs'); 
const path = require('path'); 
const os = require('os'); // Necesario para acceder a /tmp en Lambda
const { Client } = require('../models');

// 👇 IMPORTAMOS EL SERVICIO DE S3
const { uploadFile } = require('../services/s3Service');

// --- Configuración de Multer (Almacenamiento en Memoria) ---
// Vital para Lambda: No guardamos en disco persistente, solo en RAM temporalmente
const storage = multer.memoryStorage();

const uploadMiddleware = multer({ storage: storage }).single('pdfFile');

const analyzePdfRoute = async (req, res) => {
    let tempFilePath = null; // Variable para controlar la limpieza del archivo temporal

    try {
        const file = req.file; // Ahora viene en file.buffer
        const { question } = req.body; 

        if (!file || !question) {
            return res.status(400).json({ code: 0, message: 'Se requiere archivo PDF y pregunta.' });
        }

        // 1. SUBIR A S3 (Persistencia)
        // Guardamos una copia en la nube por si quieres ver el PDF después
        const timestamp = Date.now();
        const fileNameS3 = `analisis-ai-${timestamp}-${file.originalname}`;
        const s3Url = await uploadFile(fileNameS3, file.buffer, file.mimetype);

        // 2. ESCRIBIR EN /TMP (Para Gemini)
        // Gemini suele requerir un 'path' físico. En Lambda solo podemos escribir en /tmp
        const tempFileName = `temp-${timestamp}-${file.originalname}`;
        tempFilePath = path.join(os.tmpdir(), tempFileName);
        
        // Escribimos el buffer de memoria al disco efímero de Lambda
        fs.writeFileSync(tempFilePath, file.buffer);

        // 3. LLAMAR AL SERVICIO GEMINI
        // Pasamos la ruta temporal (/tmp/...)
        const generatedResponse = await geminiService.analyzePdf(
            tempFilePath,     
            file.mimetype,    
            file.originalname,
            question
        );

        // 4. PROCESAR RESPUESTA (Lógica de Negocio Original)
        const rawResponseString = generatedResponse;
        let datosFactura = null;
        let nombreCliente = null;
        let clienteEncontrado = null;
        let total = null;
        
        try {
            // Limpieza y Parseo del JSON anidado (Tal cual tu lógica original)
            const jsonStringLimpia = rawResponseString
                .replace('```json\n', '')
                .replace('\n```', '')
                .trim();

            datosFactura = JSON.parse(jsonStringLimpia);
            nombreCliente = datosFactura.cliente;
            total = datosFactura.total_monto;

            // 5. Búsqueda en la Base de Datos
            if (nombreCliente) {
                const nombreLimpio = nombreCliente.trim(); 
                // Buscamos coincidencia exacta o parcial según tu configuración de BD
                clienteEncontrado = await Client.findOne({
                    where: {
                        name: nombreLimpio
                    }
                });
            }
            
        } catch (parseError) {
            console.warn("Error parseando JSON de IA:", parseError);
            // Respuesta parcial si falla el parseo
            return res.status(202).json({ 
                code: 2, 
                message: "IA respondió, pero el procesamiento de datos falló.",
                raw_response: generatedResponse,
                file_name: file.originalname,
                file_url: s3Url // Devolvemos la URL del archivo
            });
        }
        
        // Respuesta Exitosa Completa
        res.status(200).json({
            code: 1,
            client: clienteEncontrado,
            response: generatedResponse,
            file_name: file.originalname,
            file_url: s3Url, // Útil para que el frontend muestre el PDF
            total: total
        });

    } catch (error) {
        console.error("Error en analyzePdfRoute:", error);
        res.status(500).json({ code: 0, error: error.message || "Fallo en el servicio de análisis." });
    } finally {
        // 6. LIMPIEZA OBLIGATORIA
        // Borramos el archivo de /tmp para no saturar la memoria de la Lambda
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            try {
                fs.unlinkSync(tempFilePath);
            } catch (cleanupError) {
                console.error("Error limpiando archivo temporal:", cleanupError);
            }
        }
    }
};

module.exports = { analyzePdfRoute, pdfUploadMiddleware: uploadMiddleware };