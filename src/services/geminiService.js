// src/services/geminiService.js

const { GoogleGenAI } = require('@google/genai');

// Inicializa el cliente. El SDK busca automáticamente la variable GEMINI_API_KEY
const ai = new GoogleGenAI({}); 

/**
 * Genera una descripción o sugerencia basada en el texto de entrada.
 * @param {string} promptText - El texto que se le dará al modelo.
 * @returns {string} El texto generado por el modelo.
 */
const generateContent = async (promptText) => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash', // Modelo rápido y eficiente
            contents: [{ role: "user", parts: [{ text: promptText }] }],
        });

        // Retorna solo el texto generado
        return response.text.trim();

    } catch (error) {
        console.error("Error al llamar a la API de Gemini:", error);
        throw new Error("No se pudo conectar con el servicio de IA.");
    }
};

module.exports = { generateContent };