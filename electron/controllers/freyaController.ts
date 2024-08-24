import fs from 'fs';
import path from 'path';
import { dialog } from 'electron';
import { mapXmlToNirFreyaXml } from '../mappers/freyaMappers';
import ExcelJS from 'exceljs';

async function processXmlForFreyaNir(filePath: string, callback: (error: Error | null, message?: string) => void) {
  try {
    console.log("Reading XML file:", filePath);
    const xmlData = fs.readFileSync(filePath, 'utf8');
    
    console.log("Mapping XML data to NIR structure...");
    const dataForXLS = await mapXmlToNirFreyaXml(xmlData);

    console.log("Prompting user to select a directory for saving the NIR file...");
    const { filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory', 'promptToCreate'],
      title: 'Select a folder to save your NIR files',
    });

    if (!filePaths || filePaths.length === 0) {
      throw new Error('No directory selected');
    }

    const outputDir = path.join(filePaths[0], `NIR_${new Date().toISOString().replace(/:/g, '-')}.xlsx`);
    console.log("Saving NIR file to:", outputDir);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('NIR');

    // Define headers based on your data structure
    worksheet.columns = [
      { header: 'Document Series', key: 'DocumentSeries', width: 18 },
      { header: 'Document No', key: 'DocumentNo', width: 18 },
      { header: 'Document Date', key: 'DocumentDate', width: 18 },
      { header: 'Deadline Date', key: 'DeadlineDate', width: 18 },
      { header: 'Supplier', key: 'Supplier', width: 30 },
      { header: 'Financial Administration', key: 'FinancialAdministration', width: 30 },
      { header: 'Product Name', key: 'ProductName', width: 20 },
      { header: 'Product Code', key: 'ProductCode', width: 20 },
      { header: 'Units', key: 'Units', width: 10 },
      { header: 'Unit Price Without Vat', key: 'UnitPriceWithoutVat', width: 20 },
      { header: 'Vat Rate', key: 'VatRate', width: 10 },
      { header: 'Measure Unit', key: 'MeasureUnit', width: 15 }
    ];

    // Adding data rows dynamically for each product
    dataForXLS.NIR.Products.forEach((product: any) => {
      worksheet.addRow({
        DocumentSeries: dataForXLS.NIR.DocumentSeries,
        DocumentNo: dataForXLS.NIR.DocumentNo,
        DocumentDate: dataForXLS.NIR.DocumentDate,
        DeadlineDate: dataForXLS.NIR.DeadlineDate,
        Supplier: dataForXLS.NIR.Supplier,
        FinancialAdministration: dataForXLS.NIR.FinancialAdministration,
        ProductName: product.ProductName,
        ProductCode: product.ProductCode,
        Units: product.Units,
        UnitPriceWithoutVat: product.UnitPriceWithoutVat,
        VatRate: product.VatRate,
        MeasureUnit: product.MeasureUnit
      });
    });

    console.log("Writing the NIR data to an Excel file...");
    await workbook.xlsx.writeFile(outputDir);

    console.log("NIR XLS saved successfully at", outputDir);
    callback(null, `NIR XLS saved successfully at ${outputDir}`);
  } catch (error: any) {
    console.error('Error processing XML for Freya NIR:', error);
    callback(error);
  }
}

export { processXmlForFreyaNir };
