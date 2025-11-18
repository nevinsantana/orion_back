const moment = require('moment-timezone');

// ⚠️ DEBES DEFINIR ESTA CONSTANTE EN EL SCOPE DEL ARCHIVO (CON LA CADENA BASE64 PURA)
const CERTIFICADO_BASE64_PRUEBA = process.env.BASE_64_TEST ? process.env.BASE_64_TEST.replace(/\s/g, '').replace(/[\r\n]/g, '').trim() : '';

// Constantes auxiliares
const BASE64_SELLO_PRUEBA = "30001000000500003442"; // Base64 simple válido para el atributo Sello
const CFDI_SCHEMA = 'http://www.sat.gob.mx/cfd/4 http://www.sat.gob.mx/sitio_internet/cfd/4/cfdv40.xsd';

const buildCfdi40Xml = (invoiceData) => {
    
    // --- 1. DATOS FISCALES Y DE AUTENTICACIÓN ---
    
    // ✅ FECHA ACTUAL: Para cumplir con la regla de 72 horas
    const fechaEmision = moment().tz('America/Mexico_City').format('YYYY-MM-DDTHH:mm:ss'); 
    
    // Datos del Emisor (Usando el CSD vigente más reciente de prueba)
    const rfcEmisor = "ZUÑ920208KL4"; // RFC de prueba (Verifica si cambió)
    const nombreEmisor = "ZAPATERIA URTADO —ERI";
    const regimenFiscalEmisor = "601"; 
    const lugarExpedicion = "68050"; 
    const NoCertificado = "30001000000500002669"; // Número de serie más reciente
    
    // Datos del Receptor (Usamos datos de la DB)
    const rfcReceptor = invoiceData.rfc || "XAXX010101000"; 
    const nombreReceptor = invoiceData.name || "PÚBLICO EN GENERAL";
    const domicilioFiscalReceptor = invoiceData.domicilio_fiscal_receptor || "44520"; 
    const regimenFiscalReceptor = invoiceData.regimen_fiscal_receptor || "616"; 
    const usoCfdi = invoiceData.uso_cfdi || "G03"; 

    // Datos Financieros
    const subtotal = invoiceData.subtotal || "1000.00";
    const total = invoiceData.total || "1160.00";
    const iva = "160.00";
    const folio = "12345"; 
    const conceptoDescripcion = invoiceData.descripcion || "Servicio de Facturación de Prueba";
    
    // 2. Validación
    if (!total || total === "0.00") {
        throw new Error("El monto de la factura (total) es obligatorio para el CFDI.");
    }
    
    // --- 3. GENERACIÓN DE LA CADENA XML ---
    // La plantilla se usa para una limpieza agresiva de whitespace.
    let cfdiXmlContent = `
<cfdi:Comprobante
    Version="4.0"
    Serie="A"
    Folio="${folio}"
    Fecha="${fechaEmision}"
    Sello="VEVTVA==" 
    NoCertificado="${NoCertificado}" 
    Certificado="${CERTIFICADO_BASE64_PRUEBA}"
    SubTotal="${subtotal}"
    Total="${total}"
    Moneda="MXN"
    TipoDeComprobante="I"
    Exportacion="01"
    MetodoPago="PUE"
    FormaPago="03"
    LugarExpedicion="${lugarExpedicion}"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xmlns:cfdi="http://www.sat.gob.mx/cfd/4"
    xsi:schemaLocation="${CFDI_SCHEMA}">
    
    <cfdi:Emisor Rfc="${rfcEmisor}" Nombre="${nombreEmisor}" RegimenFiscal="${regimenFiscalEmisor}"/>
    
    <cfdi:Receptor
        Rfc="${rfcReceptor}"
        Nombre="${nombreReceptor}"
        DomicilioFiscalReceptor="${domicilioFiscalReceptor}"
        RegimenFiscalReceptor="${regimenFiscalReceptor}"
        UsoCFDI="${usoCfdi}"
    />
    
    <cfdi:Conceptos>
        <cfdi:Concepto
            Cantidad="1"
            ClaveProdServ="84111506"
            ClaveUnidad="E48"
            Descripcion="${conceptoDescripcion}"
            ValorUnitario="${subtotal}"
            Importe="${subtotal}"
            ObjetoImp="02"
        >
            <cfdi:Impuestos>
                <cfdi:Traslados>
                    <cfdi:Traslado Base="${subtotal}" Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="${iva}"/>
                </cfdi:Traslados>
            </cfdi:Impuestos>
        </cfdi:Concepto>
    </cfdi:Conceptos>
    
    <cfdi:Impuestos TotalImpuestosTrasladados="${iva}">
        <cfdi:Traslados>
            <cfdi:Traslado Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="${iva}"/>
        </cfdi:Traslados>
    </cfdi:Impuestos>

</cfdi:Comprobante>`;

    // 4. LIMPIEZA FINAL Y ENSAMBLAJE
    const cleanXml = cfdiXmlContent.replace(/[\r\n]+/g, '').replace(/\s{2,}/g, ' ').trim();
    
    // Concatenamos el encabezado XML sin espacio para evitar el error de formato.
    xmlall= `<?xml version="1.0" encoding="UTF-8"?>${cleanXml}`;
    // console.log(xmlall);
    return xmlall;
};

module.exports = { buildCfdi40Xml };