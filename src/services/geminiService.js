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

const analyzeImageAndExtractAmount = async (filePath, mimeType, originalName, question) => {
    try {
        // 1. LEER EL ARCHIVO DEL DISCO A UN BUFFER
        // Esto es necesario para la codificación Base64.
        const fileContentBuffer = fs.readFileSync(filePath); 
        
        // 2. CODIFICAR el Buffer a Base64
        const base64Data = fileContentBuffer.toString("base64");

        // 3. Formular una pregunta de extracción de datos precisa para la IA
        const amountQuestion = `Basándote únicamente en la imagen del comprobante de pago, identifica el monto exacto del pago y devuelve SOLAMENTE ese número, sin texto, moneda o comas. Si no lo encuentras, devuelve '0'. Pregunta del usuario: ${question}`;

        // 4. Llamar a la API usando INLINE DATA (Base64)
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                { role: "user", parts: [
                    { 
                        inlineData: { 
                            // ✅ CAMBIO CLAVE: Usamos el mimeType real de la imagen que te dio Multer
                            // Por ejemplo: 'image/jpeg' o 'image/png'
                            mimeType: mimeType, 
                            data: base64Data 
                        } 
                    },
                    { text: amountQuestion } // Usamos la pregunta específica de extracción
                ]}
            ],
        });

        // 5. Limpiar y convertir a número
        const rawAmount = response.text.trim().replace(/[^0-9.]/g, ''); // Limpiar símbolos y texto
        const extractedAmount = parseFloat(rawAmount) || 0; // Convertir a número o 0
        
        // 6. Retornar el monto extraído
        return extractedAmount;

    } catch (error) {
        console.error("Error al analizar la imagen con Gemini:", error);
        throw new Error("No se pudo analizar la imagen para extraer el monto.");
    } finally {
        // 7. Limpieza del archivo local del disco
        // if (filePath && fs.existsSync(filePath)) {
        //     fs.unlinkSync(filePath);
        //     console.log(`[MULTER] Archivo local eliminado: ${filePath}`);
        // }
    }
};

module.exports = { 
    generateContent, 
    analyzePdf,
    analyzeImageAndExtractAmount 
};