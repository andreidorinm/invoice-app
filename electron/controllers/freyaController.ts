import fs from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';
import { mapXmlToNirFreyaXml } from '../mappers/freyaMappers';

async function processXmlForFreyaNir(
  filePath: string,
  saveDirectory: string,
  callback: (error: Error | null, message?: string) => void
) {
  try {
    console.log("Reading XML file:", filePath);
    const xmlData = fs.readFileSync(filePath, 'utf8');

    console.log("Mapping XML data to NIR structure...");
    const dataForXLS = await mapXmlToNirFreyaXml(xmlData);

    const invoiceDate = new Date(dataForXLS.NIR.DocumentDate).toISOString().split('T')[0];
    const supplierName = dataForXLS.NIR.Supplier.replace(/\s+/g, '_');

    const formattedFileName = `FREYA_NIR_${invoiceDate}_${supplierName}.xlsx`;
    const outputPath = path.join(saveDirectory, formattedFileName);
    console.log("Saving file at:", outputPath);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('NIR');

    worksheet.addRow(['DocumentSery', dataForXLS.NIR.DocumentSeries]);
    worksheet.addRow(['DocumentNo', dataForXLS.NIR.DocumentNo]);
    worksheet.addRow(['DocumentDate', dataForXLS.NIR.DocumentDate]);
    worksheet.addRow(['DeadlineDate', dataForXLS.NIR.DeadlineDate]);
    worksheet.addRow(['Supplier', dataForXLS.NIR.Supplier]);
    worksheet.addRow(['SupplierUniqueCode', '']);
    worksheet.addRow(['FinancialAdministration', dataForXLS.NIR.FinancialAdministration]);
    worksheet.addRow(['FinancialAdministrationCode', '']);
    worksheet.addRow([]);

    worksheet.addRow([
      'ProductName',
      'ProductCode',
      'Units',
      'UnitPriceWithoutVat',
      'Discount',
      'VatRate',
      'MeasureUnit',
    ]);

    dataForXLS.NIR.Products.forEach((product: any) => {
      worksheet.addRow([
        product.ProductName,
        product.ProductCode,
        product.Units,
        product.UnitPriceWithoutVat,
        product.Discount,
        product.VatRate,
        product.MeasureUnit,
      ]);
    });

    console.log("Writing the NIR data to an Excel file...");
    await workbook.xlsx.writeFile(outputPath);

    console.log("NIR XLS saved successfully at", outputPath);
    callback(null, `File saved successfully at: ${outputPath}`);
  } catch (error: any) {
    console.error('Error processing XML for Freya NIR:', error);
    callback(error);
  }
}

export { processXmlForFreyaNir };
