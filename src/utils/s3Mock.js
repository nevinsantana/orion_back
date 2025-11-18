// Este helper interactúa con el objeto global inicializado en index.js
const S3_BUCKET_NAME = 'rak-orion-invoice-reports';

/**
 * Simula la subida de un archivo a S3, guardando la metadata en memoria.
 */
const uploadToS3 = async (fileName, fileBuffer) => {
    // Asume que global.mockS3Files existe (inicializado en index.js)
    const publicUrl = `https://${S3_BUCKET_NAME}.s3.amazonaws.com/${fileName}`;
    
    if (global.mockS3Files) {
        global.mockS3Files.push({ 
            key: fileName, 
            url: publicUrl, 
            size: fileBuffer.length, 
            date: new Date() 
        });
    }

    console.log(`[S3 MOCK] Archivo subido (Memoria): ${fileName}`);
    return publicUrl;
};

/**
 * Devuelve la lista de archivos mockeados.
 */
const listMockedReports = async () => {
    // Devuelve los archivos guardados en la variable global
    if (!global.mockS3Files) {
        global.mockS3Files = [];
    }
    return {
        repositoryName: S3_BUCKET_NAME,
        files: global.mockS3Files.map(f => ({
            key: f.key,
            url: f.url,
            size: `${(f.size / 1024).toFixed(1)} KB`,
            date: f.date.toISOString()
        }))
    };
};

module.exports = {
    uploadToS3,
    listMockedReports
};