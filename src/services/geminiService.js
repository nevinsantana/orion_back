// src/services/geminiService.js

const { GoogleGenAI } = require('@google/genai');
const path = require('path');
const fs = require('fs'); // <--- ¡Importar FS aquí!
const ai = new GoogleGenAI({}); 

/**
 * Función 1: Genera contenido basado SÓLO en texto (usada por aiController)
 */
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

/**
 * Función 2: Analiza un PDF (usada por analyzePdfRoute)
 */
const analyzePdf = async (filePath, mimeType, question) => {
    let uploadedFile;
    try {
        const fileContent = fs.readFileSync(filePath); 
        console.log(filePath,
                'application/pdf',
                path.basename(filePath))
        // 1. Cargar el archivo al servicio de Gemini
        uploadedFile = await ai.files.upload({
            file: filePath,
            mimeType: 'application/pdf',
            displayName: path.basename(filePath)
        });

        // // 2. Llamar a la API con la referencia al archivo y la pregunta
        // const response = await ai.models.generateContent({
        //     model: 'gemini-2.5-flash',
        //     contents: [
        //         { role: "user", parts: [
        //             { fileData: { mimeType: uploadedFile.mimeType, fileUri: uploadedFile.uri } },
        //             { text: question }
        //         ]}
        //     ],
        // });

        // return response.text.trim();

    } catch (error) {
        console.error(error);
        throw new Error("No se pudo analizar el PDF o conectar con la IA.");
    } finally {
        // 3. Eliminar el archivo del servicio de Gemini
        if (uploadedFile) {
             await ai.files.delete({ name: uploadedFile.name });
             console.log(`[GEMINI] Archivo temporal eliminado: ${uploadedFile.name}`);
        }
        // Nota: La eliminación del archivo local se maneja en el controlador
    }
};

module.exports = { generateContent, analyzePdf };