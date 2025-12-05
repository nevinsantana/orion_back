require('dotenv').config();
// 👇 1. Agregamos ListObjectsV2Command para arreglar el error "listFiles is not a function"
const { S3Client, PutObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');

// 2. CORRECCIÓN CRÍTICA:
// Quitamos la configuración manual de 'credentials'.
// Al dejarlo vacío, el SDK de AWS detecta automáticamente si está en Lambda (y usa el Rol correcto)
// o si está en Local (y usa tus variables .env). ¡Esto elimina el error InvalidAccessKeyId!
const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1'
});

// 3. Mock Global para Local
global.mockS3Files = global.mockS3Files || {};

/**
 * Sube un archivo a S3 (Prod) o al Mock (Local)
 */
const uploadFile = async (fileName, fileBuffer, mimeType) => {
    const isProduction = process.env.NODE_ENV === 'production';
    const bucketName = process.env.S3_BUCKET_NAME;

    if (isProduction) {
        // --- LÓGICA AWS REAL (NUBE) ---
        console.log(`[S3] Subiendo ${fileName} a bucket: ${bucketName}...`);
        
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: fileName,
            Body: fileBuffer,
            ContentType: mimeType,
        });

        try {
            await s3Client.send(command);
            // Retorna URL pública
            return `https://${bucketName}.s3.amazonaws.com/${fileName}`;
        } catch (error) {
            console.error("[S3] Error crítico subiendo a AWS:", error);
            // Lanzamos el error para que el controller lo sepa
            throw new Error("Fallo al subir archivo a S3: " + error.message);
        }

    } else {
        // --- LÓGICA MOCK (LOCAL) ---
        console.log(`[MOCK] Guardando ${fileName} en memoria RAM...`);
        global.mockS3Files[fileName] = fileBuffer;
        
        const port = process.env.APP_PORT || 9000;
        return `http://localhost:${port}/mock-s3/${fileName}`;
    }
};

/**
 * 4. AGREGAMOS LA FUNCIÓN FALTANTE 'listFiles'
 * Esto arregla el error "TypeError: listFiles is not a function"
 */
const listFiles = async () => {
    const isProduction = process.env.NODE_ENV === 'production';
    const bucketName = process.env.S3_BUCKET_NAME;

    if (isProduction) {
        try {
            const command = new ListObjectsV2Command({ Bucket: bucketName });
            const response = await s3Client.send(command);
            
            return (response.Contents || []).map(item => ({
                key: item.Key,
                fileName: item.Key,
                url: `https://${bucketName}.s3.amazonaws.com/${item.Key}`,
                lastModified: item.LastModified,
                size: item.Size
            }));
        } catch (error) {
            console.error("[S3] Error listando archivos:", error);
            return []; // Retornamos vacío para no romper el front
        }
    } else {
        // Lógica Mock Local
        return Object.keys(global.mockS3Files || {}).map(key => ({
            key,
            fileName: key,
            url: `http://localhost:${process.env.APP_PORT || 9000}/mock-s3/${key}`,
            lastModified: new Date()
        }));
    }
};

module.exports = { uploadFile, listFiles };