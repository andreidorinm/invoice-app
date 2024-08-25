import fs from 'fs';
import path from 'path';
import { dialog } from 'electron';
import ExcelJS from 'exceljs';
import { mapXmlToSmartBillNir } from '../mappers/smartbillMappers';

async function processXmlForSmartBill(filePath: any, callback: any) {
  try {
    console.log("Reading XML file:", filePath);
    const xmlData = fs.readFileSync(filePath, 'utf8');

    const dataMapped = await mapXmlToSmartBillNir(xmlData);
    const dataForXLS = dataMapped.SmartBill.Products;

    const { filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Select folder for saving NIR file',
    });

    if (!filePaths || filePaths.length === 0) {
      throw new Error('No directory selected');
    }

    const outputDir = path.join(filePaths[0], `SmartBill_NIR_${new Date().toISOString().replace(/:/g, '-')}.xlsx`);
    console.log("Saving file at:", outputDir);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('NIR');

    worksheet.columns = [
      { header: 'Denumire produs', key: 'Denumire produs', width: 30 },
      { header: 'Cod produs', key: 'Cod produs', width: 20 },
      { header: 'Pret', key: 'Pret', width: 15 },
      { header: 'Pretul contine TVA', key: 'Pretul contine TVA', width: 20 },
      { header: 'Unitate masura', key: 'Unitate masura', width: 20 },
      { header: 'Moneda', key: 'Moneda', width: 10 },
      { header: 'Cota TVA', key: 'Cota TVA', width: 10 },
      { header: 'Tip', key: 'Tip', width: 10 }
    ];

    dataForXLS.forEach((product: any) => {
      worksheet.addRow(product);
    });

    await workbook.xlsx.writeFile(outputDir);
    callback(null, `Fisier salvat cu succes la: ${outputDir}`);
  } catch (error) {
    console.error('Error processing XML for Smart Bill:', error);
    callback(error);
  }
}

export { processXmlForSmartBill };
