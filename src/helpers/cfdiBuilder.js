const moment = require('moment-timezone');
const DELIMITADOR = '|';
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

const buildCfdi40Txt = (invoiceData) => {
    
    // --- DATOS DEL EMISOR (DUMMY VÁLIDO PARA PRUEBAS) ---
    const rfcEmisor = "ESI920427886"; 
    const nombreEmisor = "FACTURACION MODERNA SA DE CV";
    const regimenFiscalEmisor = "601"; 
    const lugarExpedicion = "68050"; // CP del Emisor (Se asume un CP de prueba)

    // --- DATOS DE LA FACTURA (DE LA DB) ---
    const fechaEmision = moment().tz('America/Mexico_City').format('YYYY-MM-DDTHH:mm:ss');
    const subtotal = (parseFloat(invoiceData.subtotal) || 1000.00).toFixed(2); // Asumo subtotal es campo de DB
    const total = (parseFloat(invoiceData.total_amount) || 1160.00).toFixed(2); // Usar total_amount de la DB
    const iva = (parseFloat(total) - parseFloat(subtotal)).toFixed(2);
    const folio = '12345'; 
    
    // ----------------------------------------------------
    // INICIO DEL ENSAMBLAJE DEL ARCHIVO TXT
    // ----------------------------------------------------
    let txtContent = "";
    
    // 1. ENCABEZADO (COMPROBANTE)
    // El RFC y Nombre del Emisor son duros aquí
    // ENCABEZADO|VERSION|SERIE|FOLIO|FECHA|FORMA_PAGO|SUBTOTAL|MONEDA|TOTAL|TIPO_DE_COMPROBANTE|METODO_PAGO|LUGAR_EXPEDICION|EXPORTACION|...
    txtContent += `@ENCABEZADO${DELIMITADOR}4.0${DELIMITADOR}A${DELIMITADOR}${folio}${DELIMITADOR}${fechaEmision}${DELIMITADOR}${invoiceData.forma_pago || '03'}${DELIMITADOR}${subtotal}${DELIMITADOR}MXN${DELIMITADOR}${total}${DELIMITADOR}I${DELIMITADOR}${invoiceData.metodo_pago || 'PUE'}${DELIMITADOR}${lugarExpedicion}${DELIMITADOR}01\n`;

    // 2. EMISOR (Usa los datos duros)
    txtContent += `@EMISOR${DELIMITADOR}${rfcEmisor}${DELIMITADOR}${nombreEmisor}${DELIMITADOR}${regimenFiscalEmisor}${DELIMITADOR}AQUI_VA_EL_CERTIFICADO_Y_LLAVE\n`;

    // 3. RECEPTOR (Usa los datos de la DB)
    // RECEPTOR|RFC|NOMBRE|DOMICILIO_FISCAL_RECEPTOR|REGIMEN_FISCAL_RECEPTOR|USO_CFDI
    txtContent += `@RECEPTOR${DELIMITADOR}${invoiceData.rfc}${DELIMITADOR}${invoiceData.name}${DELIMITADOR}${invoiceData.domicilio_fiscal_receptor}${DELIMITADOR}${invoiceData.regimen_fiscal_receptor}${DELIMITADOR}${invoiceData.uso_cfdi}\n`;

    // 4. CONCEPTO (Usamos un concepto de prueba)
    // CONCEPTO|CLAVE_PROD_SERV|NO_IDENTIFICACION|CANTIDAD|CLAVE_UNIDAD|UNIDAD|DESCRIPCION|VALOR_UNITARIO|IMPORTE|OBJETO_IMP|...
    txtContent += `@CONCEPTO${DELIMITADOR}84111506${DELIMITADOR}1${DELIMITADOR}1${DELIMITADOR}E48${DELIMITADOR}Pieza${DELIMITADOR}${invoiceData.name || 'Servicio de Prueba'}${DELIMITADOR}${subtotal}${DELIMITADOR}${subtotal}${DELIMITADOR}02\n`;

    // 5. IMPUESTOS (Traslado de IVA 16% por concepto)
    txtContent += `@IMPUESTO_TRASLADO${DELIMITADOR}${subtotal}${DELIMITADOR}002${DELIMITADOR}Tasa${DELIMITADOR}0.160000${DELIMITADOR}${iva}${DELIMITADOR}1\n`;

    // 6. IMPUESTOS GLOBALES (Resumen)
    txtContent += `@IMPUESTOS_TRASLADO${DELIMITADOR}002${DELIMITADOR}Tasa${DELIMITADOR}0.160000${DELIMITADOR}${iva}\n`;
    
    // Devolver la cadena TXT final
    return txtContent;
};

module.exports = { buildCfdi40Xml, buildCfdi40Txt };