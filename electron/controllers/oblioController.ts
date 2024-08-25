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

    const outputDir = path.join(filePaths[0], `Oblio_NIR_${new Date().toISOString().replace(/:/g, '-')}.xlsx`);
    console.log("Salvarea fișierului la:", outputDir);

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

    // Adding data rows dynamically
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

    console.log("Scrierea datelor într-un fișier Excel...");
    await workbook.xlsx.writeFile(outputDir);

    console.log("Fisier salvat cu succes la:", outputDir);
    callback(null, `Fisier salvat cu succes la: ${outputDir}`);
  } catch (error: any) {
    console.error('Eroare la procesarea XML pentru Oblio:', error);
    callback(error);
  }
}

export { processXmlForOblio };
