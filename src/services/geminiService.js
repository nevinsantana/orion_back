// src/services/geminiService.js

const { GoogleGenAI } = require('@google/genai');
const fs = require('fs'); // Necesario para leer el disco
const path = require('path'); // Necesario para path.basename
const ai = new GoogleGenAI({}); 

// ... (Función generateContent) ...
const generateContent = async (promptText) => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: "user", parts: [{ text: promptText }] }],
        });

        return response.text.trim();

    } catch (error) {
        console.error("Error al llamar a la API de Gemini (Text Only):", error);
        throw new Error("No se pudo conectar con el servicio de IA.");
    }
};


const analyzePdf = async (filePath, mimeType, originalName, question) => { 
    // No necesitamos 'uploadedFile' para la limpieza de Gemini aquí.
    try {
        // 1. LEER EL ARCHIVO DEL DISCO A UN BUFFER
        const fileContentBuffer = fs.readFileSync(filePath); 
        
        // 2. CODIFICAR el Buffer a Base64
        const base64Data = fileContentBuffer.toString("base64");

        // 3. Llamar a la API usando INLINE DATA (Base64)
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                { role: "user", parts: [
                    { 
                        inlineData: { // <-- Usamos inlineData
                            mimeType: 'application/pdf',
                            data: base64Data // <-- Pasamos el Base64
                        } 
                    },
                    { text: question }
                ]}
            ],
        });

        // 4. Retornar la respuesta (la limpieza del archivo local es CRUCIAL en el controlador)
        return response.text.trim();

    } catch (error) {
        console.error("Error al analizar el PDF con Gemini:", error);
        throw new Error("No se pudo analizar el PDF o conectar con la IA.");
    } finally {
        // 2. Limpieza del archivo local del disco (¡DEBE ESTAR DESCOMENTADO!)
        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`[MULTER] Archivo local eliminado: ${filePath}`);
        }
    }
};

module.exports = { generateContent, analyzePdf };