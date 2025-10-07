// src/controllers/aiController.js

const geminiService = require('../services/geminiService');

/**
 * POST /api/ai/generate - Recibe un prompt y devuelve contenido generado.
 * Es un controlador público, ya que no toca datos del usuario.
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
            prompt_sent: prompt,
        });

    } catch (error) {
        // El error ya fue logueado en el servicio
        res.status(500).json({
            code: 0,
            error: error.message || "Fallo en el servicio de generación de IA."
        });
    }
};

module.exports = { generateResponse };