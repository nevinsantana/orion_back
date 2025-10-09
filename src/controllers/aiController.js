// src/controllers/aiController.js

const geminiService = require('../services/geminiService');
const multer = require('multer');
const fs = require('fs'); 
const path = require('path'); // <-- Necesario para la ruta absoluta

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
        
        res.status(200).json({
            code: 1,
            response: generatedResponse,
            file_name: file.originalname 
        });

    } catch (error) {
        console.error("Error en analyzePdfRoute:", error);
        res.status(500).json({ code: 0, error: error.message || "Fallo en el servicio de análisis." });
    } finally {
        // 2. Limpieza del archivo local del disco
        // if (filePath && fs.existsSync(filePath)) {
        //     fs.unlinkSync(filePath);
        //     console.log(`[MULTER] Archivo local eliminado: ${filePath}`);
        // }
    }
};

module.exports = { analyzePdfRoute, pdfUploadMiddleware: uploadMiddleware };