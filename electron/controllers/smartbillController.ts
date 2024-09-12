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
    const documentDate = new Date(dataMapped.documentDate).toISOString().split('T')[0];
    const supplierName = dataMapped.supplierName.replace(/[^a-zA-Z0-9]/g, '_');
    const outputDir = path.join(filePaths[0], `Smartbill_NIR_${documentDate}_${supplierName}.xlsx`);
    console.log("Saving file at:", outputDir);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('NIR');

    worksheet.columns = [
      { header: 'Cod', key: 'Cod', width: 15 },
      { header: 'Articol', key: 'Articol', width: 30 },
      { header: 'Categorie', key: 'Categorie', width: 20 },
      { header: 'Tip', key: 'Tip', width: 15 },
      { header: 'Cant.', key: 'Cant.', width: 10 },
      { header: 'Pret', key: 'Pret', width: 15 },
      { header: 'Um', key: 'Um', width: 15 }
    ];

    dataForXLS.forEach((product: any) => {
      worksheet.addRow({
        'Cod': product.Cod,
        'Articol': product.Articol,
        'Categorie': product.Categorie,
        'Tip': product.Tip,
        'Cant.': product['Cant.'],
        'Pret': product.Pret,
        'Um': product.Um
      });
    });

    await workbook.xlsx.writeFile(outputDir);
    callback(null, `File saved successfully at: ${outputDir}`);
  } catch (error) {
    console.error('Error processing XML for Smart Bill:', error);
    callback(error);
  }
}

export { processXmlForSmartBill };
