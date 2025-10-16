// src/controllers/aiController.js

const geminiService = require('../services/geminiService');
const multer = require('multer');
const fs = require('fs'); 
const path = require('path'); 
const { Client } = require('../models');

// --- Configuración de Multer (Almacenamiento en Disco) ---
const diskStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        // RUTA ABSOLUTA: __dirname apunta a la carpeta 'controllers',
        // subimos un nivel para ir a 'src', y luego bajamos a 'uploads'.
        const uploadDir = path.join(__dirname, '..', '..', 'uploads'); 
        
        // **CLAVE:** Crea la carpeta si no existe
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        
        cb(null, uploadDir); 
    },
    filename: (req, file, cb) => {
        // ... (El nombre de archivo es correcto) ...
        cb(null, `${path.basename(file.originalname, path.extname(file.originalname))}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const uploadMiddleware = multer({ storage: diskStorage }).single('pdfFile');


const analyzePdfRoute = async (req, res) => {
    let filePath = req.file ? req.file.path : null; 
    
    try {
        const file = req.file;
        const { question } = req.body; 

        if (!file || !question) {
            return res.status(400).json({ code: 0, message: 'Se requiere archivo y pregunta.' });
        }
        
        // 1. Llamar al servicio, pasando la RUTA DEL DISCO
        const generatedResponse = await geminiService.analyzePdf(
            file.path,        // <-- Ahora file.path debe ser una ruta válida
            file.mimetype,    
            file.originalname,
            question
        );

        const rawResponseString = generatedResponse;
        let datosFactura = null;
        let nombreCliente = null;
        let clienteEncontrado = null;
        let total = null;
        
        try {
            // Limpieza y Parseo del JSON anidado
            const jsonStringLimpia = rawResponseString
                .replace('```json\n', '')
                .replace('\n```', '')
                .trim();

            datosFactura = JSON.parse(jsonStringLimpia);
            nombreCliente = datosFactura.cliente;
            total = datosFactura.total_monto
            // 2. Búsqueda en la Base de Datos
            if (nombreCliente) {
                // Asume que Cliente.findOne() es una función de tu ORM/ODM
                // Usa un try/catch específico para esta búsqueda si es necesario
                const nombreLimpio = nombreCliente.trim(); 
                clienteEncontrado = await Client.findOne({
                    where: {
                        name: nombreLimpio // Si esto trae resultados correctos, el problema es el Op/fn
                    }
                });
            }
            
        } catch (parseError) {
            return res.status(202).json({ 
                code: 2, 
                message: "IA respondió, pero el procesamiento de datos falló.",
                raw_response: generatedResponse,
                file_name: file.originalname
            });
        }
        
        res.status(200).json({
            code: 1,
            client: clienteEncontrado,
            response: generatedResponse,
            file_name: file.originalname,
            total: total
        });

    } catch (error) {
        console.error("Error en analyzePdfRoute:", error);
        res.status(500).json({ code: 0, error: error.message || "Fallo en el servicio de análisis." });
    } finally {
        // 2. Limpieza del archivo local del disco
        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            //console.log(`[MULTER] Archivo local eliminado: ${filePath}`);
        }
    }
};

module.exports = { analyzePdfRoute, pdfUploadMiddleware: uploadMiddleware };