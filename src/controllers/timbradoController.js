const { Invoice } = require('../models');
const { buildCfdi40Xml } = require('../helpers/cfdiBuilder'); 
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const soap = require('soap'); // Necesario para crear el cliente SOAP

// --- CONFIGURACIÓN DE LLAVES PRIVADAS (Debe apuntar a tus archivos de prueba) ---
const PRIVATE_KEY_PATH = path.join(__dirname, '..', '..', 'public', 'sat', 'CSD_Sucursal_1_ZUÑ920208KL4_20230118_140939.key');
const PRIVATE_KEY_PASSWORD = '12345678a'; // Contraseña de tu llave privada

// --- VARIABLES DE SOLUCIÓN FACTIBLE ---
const USUARIO_SF = process.env.SF_TEST_USERNAME;
const PASSWORD_SF = process.env.SF_TEST_PASSWORD;
const URL_WSDL = process.env.SF_API_URL_SANDBOX || 'https://testing.solucionfactible.com/ws/services/Timbrado?wsdl';

// El placeholder del sello que se reemplazará en el XML (debe coincidir con el valor en cfdiBuilder.js)
const BASE64_SELLO_PLACEHOLDER = "VEVTVA=="; 


// ----------------------------------------------------
// FUNCIONES HELPER CRIPTOGRÁFICAS (PLACEHOLDERS)
// ----------------------------------------------------

// ⚠️ NOTA: En un proyecto real, estas funciones usarían una librería CFDI para XSLT/Firma.

const generarCadenaOriginal = (xmlString) => {
    // ESTO ES UNA SIMPLIFICACIÓN EXTREMA. En realidad, se usa XSLT del SAT.
    // Limpiamos los encabezados de la cadena para simular la Cadena Original.
    return xmlString.replace(/<\?xml[^>]*\?>/, '').replace(/<cfdi:Comprobante[^>]*>/, '').trim(); 
};

const firmarCadena = (cadenaOriginal, keyPath, password) => {
    // ⚠️ ESTA FUNCIÓN FALLARÁ LA VALIDACIÓN DEL SAT. Solo sirve como placeholder.
    // Usamos un hash simple para devolver una cadena Base64 válida.
    const selloHash = crypto.createHash('sha256').update(cadenaOriginal).digest('hex');
    return Buffer.from(selloHash).toString('base64');
};


// ----------------------------------------------------
// SERVICIO DE TIMBRADO (SUSTITUYE A timbrarCfdi)
// ----------------------------------------------------

const timbrarServicio = (cfdiXmlString) => {
    
    if (!cfdiXmlString) {
        throw new Error("Se requiere la cadena XML del CFDI para el timbrado.");
    }

    // Codificar el XML YA SELLADO a Base64
    const cfdiBase64 = Buffer.from(cfdiXmlString, 'utf-8').toString('base64');
    
    const args = {
        usuario: USUARIO_SF,
        password: PASSWORD_SF,
        cfdi: cfdiBase64,
        zip: false
    };

    return new Promise((resolve, reject) => {
        
        soap.createClient(URL_WSDL, function(err, client) {
            if (err) {
                console.error("Error al crear el cliente SOAP:", err);
                return reject(new Error("No se pudo conectar al WSDL de Solución Factible."));
            }

            // Usamos timbrarBase64 (el método expuesto en el WSDL)
            client.timbrarBase64(args, function(err, result) { 
                if (err) {
                    return reject(new Error("Error de red o SOAP."));
                }
                
                const ret = result.return;
                
                if (ret.status == 200) {
                    console.log(`Timbrado exitoso. UUID: ${ret.resultados[0].uuid}`);
                    resolve(ret.resultados[0]);
                } else {
                    console.error(`Error de Timbrado [${ret.status}]: ${ret.mensaje}`);
                    reject(new Error(`Error de timbrado: ${ret.mensaje}`));
                }
            });
        });
    });
};


// ----------------------------------------------------
// FUNCIÓN CONTROLADORA PRINCIPAL
// ----------------------------------------------------

const timbrar = async (req, res) => {
    try {
        // 1. Obtener la factura de prueba de la base de datos
        const invoiceRecord = await Invoice.findByPk(1); 

        if (!invoiceRecord) {
            return res.status(404).json({
                code: 0,
                message: 'Error: Factura de prueba ID 1 no encontrada en la base de datos.'
            });
        }
        
        // 2. Preparar los datos
        const invoiceData = invoiceRecord.toJSON(); 

        // 3. Generar el XML con el placeholder (Sello="VEVTVA==")
        let cfdiXmlString = buildCfdi40Xml(invoiceData); 

        // 4. CALCULAR EL SELLO DIGITAL
        const cadenaOriginal = generarCadenaOriginal(cfdiXmlString); 
        const selloCalculado = firmarCadena(cadenaOriginal, PRIVATE_KEY_PATH, PRIVATE_KEY_PASSWORD);
        
        // 5. REEMPLAZAR EL PLACEHOLDER DEL SELLO
        const cfdiXmlFinal = cfdiXmlString.replace(
            `Sello="${BASE64_SELLO_PLACEHOLDER}"`, 
            `Sello="${selloCalculado}"`
        );
        console.log(cfdiXmlFinal);
        // 6. LLAMAR AL SERVICIO DE TIMBRADO (SOAP)
        const resultadoTimbrado = await timbrarServicio(cfdiXmlFinal);

        // 7. Devolver la respuesta
        res.status(200).json({
            code: 1,
            message: 'Timbrado de factura solicitado exitosamente.',
            data: resultadoTimbrado
        });

    } catch (error) {
        console.error('Error en el proceso de Timbrado:', error);
        res.status(500).json({
            code: 0,
            error: error.message || 'Fallo interno en el timbrado de la factura.'
        });
    }
};

module.exports = { timbrar };