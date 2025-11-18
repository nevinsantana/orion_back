const { GoogleGenerativeAI } = require('@google/generative-ai');

// Inicialización del cliente de Gemini
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'MOCK_API_KEY');
const aiModel = 'gemini-2.5-flash'; 

/**
 * Genera contenido (análisis) usando la API de Gemini.
 * @param {string} systemInstruction - Instrucción para el rol de la IA.
 * @param {string} userQuery - La pregunta o datos a analizar.
 * @returns {Promise<string>} La respuesta de la IA.
 */
const generateContent = async (systemInstruction, userQuery) => {
    try {
        const response = await ai.models.generateContent({
            model: aiModel,
            contents: [{ role: 'user', parts: [{ text: userQuery }] }],
            config: {
                systemInstruction: systemInstruction,
            }
        });
        
        return response.text;
    } catch (error) {
        console.error('[GEMINI SERVICE ERROR]', error);
        throw new Error('Fallo en la conexión o la API de Gemini.');
    }
};

module.exports = {
    generateContent
};