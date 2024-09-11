import fs from 'fs';
import path from 'path';
import { dialog } from 'electron';
import { mapXmlToOblioXml } from '../mappers/oblioMappers';
import ExcelJS from 'exceljs';

async function processXmlForOblio(filePath: string, callback: (error: Error | null, message?: string) => void) {
  try {
    console.log("Reading XML file:", filePath);
    const xmlData = fs.readFileSync(filePath, 'utf8');

    console.log("Mapping XML data to Oblio structure...");
    const dataForXLS = await mapXmlToOblioXml(xmlData);

    console.log("Prompting user to select a directory for saving the file...");
    const { filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory', 'promptToCreate'],
      title: 'Selectează un folder pentru a salva fișierele',
    });

    if (!filePaths || filePaths.length === 0) {
      throw new Error('Niciun director selectat');
    }

    const documentDate = new Date(dataForXLS.documentDate).toISOString().split('T')[0];
    const supplierName = dataForXLS.supplierName.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `Oblio_NIR_${documentDate}_${supplierName}.xlsx`;

    const outputDir = path.join(filePaths[0], fileName);
    console.log("Saving the file at:", outputDir);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Date Oblio');

    worksheet.columns = [
      { header: 'Denumire Produs', key: 'ProductName', width: 20 },
      { header: 'Cod Produs', key: 'ProductCode', width: 20 },
      { header: 'Unitate de Măsură', key: 'MeasureUnit', width: 15 },
      { header: 'Cantitate', key: 'Units', width: 10 },
      { header: 'Preț Achiziție', key: 'UnitPriceWithoutVat', width: 18 },
      { header: 'Cota TVA', key: 'VatRate', width: 10 },
      { header: 'TVA Inclus', key: 'VATInclusion', width: 12 }
    ];

    dataForXLS.Oblio.Products.forEach((product: any) => {
      worksheet.addRow({
        ProductName: product['Denumire produs'],
        ProductCode: product['Cod produs'],
        MeasureUnit: product['U.M.'],
        Units: product['Cantitate'],
        UnitPriceWithoutVat: product['Pret achizitie'],
        VatRate: product['Cota TVA'],
        VATInclusion: product['TVA inclus']
      });
    });

    console.log("Writing the data to an Excel file...");
    await workbook.xlsx.writeFile(outputDir);

    console.log("File successfully saved at:", outputDir);
    callback(null, `File saved successfully at: ${outputDir}`);
  } catch (error: any) {
    console.error('Error processing XML for Oblio:', error);
    callback(error);
  }
}

export { processXmlForOblio };
