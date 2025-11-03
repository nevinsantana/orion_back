const fs = require('fs');
const path = require('path');

// ⚠️ 1. DEFINE LA RUTA EXACTA A TU ARCHIVO .CER AQUÍ
// Ejemplo de ruta, ajusta 'nombre_de_tu_certificado.cer' y la carpeta:
const certFilePath = path.join(__dirname, '../../public', 'testing_cer.cer'); 

try {
    // 2. Lee el archivo binario del certificado (.cer)
    const certContent = fs.readFileSync(certFilePath); 

    // 3. Codifica el contenido a Base64 puro
    // Node.js no incluye automáticamente saltos de línea, lo cual es ideal.
    const base64String = certContent.toString('base64');

    console.log("-----------------------------------------------------------------------------------------------------");
    console.log("✅ CADENA BASE64 PURA GENERADA (COPIAR EL TEXTO COMPLETO ABAJO):");
    console.log("-----------------------------------------------------------------------------------------------------");
    console.log(base64String);
    console.log("-----------------------------------------------------------------------------------------------------");
    
} catch (error) {
    console.error("🛑 Error al procesar el certificado.");
    console.error(`Verifica la ruta: ${certFilePath}`);
    console.error(`Detalle: ${error.message}`);
}