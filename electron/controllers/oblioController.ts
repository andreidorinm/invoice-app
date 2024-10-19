import fs from 'fs/promises';
import path from 'path';
import { mapXmlToOblioXml } from '../mappers/oblioMappers';
import ExcelJS from 'exceljs';

async function processXmlForOblio(
  filePath: string,
  saveDirectory: string,
  callback: (error: Error | null, message?: string) => void
) {
  try {
    const xmlData = await fs.readFile(filePath, 'utf8');
    const dataForXLS = await mapXmlToOblioXml(xmlData);

    const documentDate = new Date(dataForXLS.documentDate).toISOString().split('T')[0];
    const supplierName = dataForXLS.supplierName.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `Oblio_NIR_${documentDate}_${supplierName}.xlsx`;
    const outputPath = path.join(saveDirectory, fileName);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Date Oblio');

    worksheet.columns = [
      { header: 'Denumire produs', key: 'Denumire produs', width: 20 },
      { header: 'Cod produs', key: 'Cod produs', width: 20 },
      { header: 'U.M.', key: 'U.M.', width: 15 },
      { header: 'Cantitate', key: 'Cantitate', width: 10 },
      { header: 'Pret achizitie', key: 'Pret achizitie', width: 18 },
      { header: 'Cota TVA', key: 'Cota TVA', width: 10 },
      { header: 'TVA Inclus', key: 'TVA Inclus', width: 12 },
    ];

    dataForXLS.Oblio.Products.forEach((product: any) => {
      worksheet.addRow(product);
    });

    await workbook.xlsx.writeFile(outputPath);

    console.log("File successfully saved at:", outputPath);
    callback(null, `File saved successfully at: ${outputPath}`);
  } catch (error: any) {
    console.error('Error processing XML for Oblio:', error);
    callback(error);
  }
}

export { processXmlForOblio };
