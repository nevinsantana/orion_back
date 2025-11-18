const ExcelJS = require('exceljs');

/**
 * Genera un buffer de archivo XLSX a partir de datos de un portafolio.
 * @param {Array<object>} portfolioData - Los datos a incluir en el reporte.
 * @param {string} sheetName - Nombre de la hoja en el workbook.
 * @returns {Promise<Buffer>} Buffer del archivo XLSX.
 */
const generateXLSReport = async (portfolioData, sheetName = 'Reporte') => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(sheetName);

    if (!portfolioData || portfolioData.length === 0) {
        return await workbook.xlsx.writeBuffer(); // Devuelve un buffer vacío
    }

    // Definir columnas basándose en la estructura del primer elemento
    const sampleItem = portfolioData[0];
    
    // Mapeo de campos relevantes para el reporte (usamos camelCase en key)
    sheet.columns = [
        { header: 'ID Factura', key: 'id', width: 10 },
        { header: 'Cliente', key: 'clientName', width: 30 },
        { header: 'Monto Total', key: 'totalAmount', width: 15, style: { numFmt: '"$"#,##0.00' } },
        { header: 'Saldo Pendiente', key: 'saldoPendiente', width: 15, style: { numFmt: '"$"#,##0.00' } },
        { header: 'Fecha Vencimiento', key: 'dueDate', width: 18, style: { numFmt: 'yyyy-mm-dd' } },
        { header: 'Estatus', key: 'status', width: 25 },
        // Incluir campos de Antigüedad si existen
        ...(sampleItem.agingRange ? [{ header: 'Rango Antigüedad', key: 'agingRange', width: 25 }, { header: 'Días Vencidos', key: 'daysOverdue', width: 15 }] : []),
    ];

    // Estilo de encabezado
    sheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D47A1' } };
    });

    // Llenado de Filas
    portfolioData.forEach((item) => {
        sheet.addRow({
            id: item.id,
            clientName: item.client?.name || 'N/A', // Usamos optional chaining para seguridad
            totalAmount: parseFloat(item.total_amount),
            saldoPendiente: parseFloat(item.saldoPendiente),
            dueDate: new Date(item.due_date),
            status: item.status,
            agingRange: item.agingRange,
            daysOverdue: item.daysOverdue
        });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
};

module.exports = {
    generateXLSReport
};