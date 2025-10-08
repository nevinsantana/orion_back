const geminiService = require('../services/geminiService');
const multer = require('multer');

// --- Configuración de Multer ---
// Almacena el archivo en la RAM (Buffer) en lugar de usar un archivo temporal en disco.
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

/**
 * Middleware de Multer para la ruta de análisis de PDF.
 * Exportamos esta constante para usarla directamente en el archivo de rutas (routes/ai.js).
 * El nombre del campo del formulario es 'pdfFile'.
 */
const pdfUploadMiddleware = upload.single('pdfFile');


/**
 * POST /api/ai
 * Función para generar texto simple (sin archivos).
 */
const generateResponse = async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({
                code: 0,
                message: 'Se requiere un prompt (texto de entrada) para generar una respuesta.'
            });
        }

        const generatedText = await geminiService.generateContent(prompt);

        res.status(200).json({
            code: 1,
            response: generatedText,
        });

    } catch (error) {
        res.status(500).json({
            code: 0,
            error: error.message || "Fallo en el servicio de generación de IA (texto)."
        });
    }
};


/**
 * POST /api/ai/analyze-pdf
 * Función para analizar un PDF.
 */
const analyzePdfRoute = async (req, res) => {
    try {
        const file = req.file; // El archivo ahora es un Buffer en req.file.buffer
        const { question } = req.body; 

        // 1. Validación de entrada
        if (!file || !question) {
            // No necesitamos fs.unlinkSync porque el archivo está en la memoria RAM
            return res.status(400).json({
                code: 0,
                message: 'Se requiere un archivo PDF y una pregunta (campo "question").'
            });
        }
        
        // 2. Llamar al servicio, pasando el Buffer y el MimeType
        const generatedResponse = await geminiService.analyzePdf(
            file.buffer,      // Contenido del archivo en memoria
            file.mimetype,    // Tipo MIME reportado por Multer (application/pdf)
            question
        );
        
        // 3. Devolver la respuesta
        res.status(200).json({
            code: 1,
            response: generatedResponse,
            file_name: file.originalname // Mantenemos el nombre original para referencia
        });

    } catch (error) {
        // En caso de error, el Buffer se limpiará automáticamente de la memoria RAM.
        res.status(500).json({
            code: 0,
            error: error.message || "Fallo en el servicio de análisis de PDF."
        });
    }
};

module.exports = { 
    generateResponse,
    analyzePdfRoute,
    pdfUploadMiddleware // Exporta el middleware de Multer para usarlo en el router
};