import parseXml from '../services/xmlParser';
import writeCsvData from '../utils/csvWriter';
import formatDate from '../utils/formatDate';
import store from '../config/electronStore';
import { dialog } from 'electron';
import fs from 'fs';
import path from 'path';
import { mapXmlDataToFacturisDesktopNirCsv, mapXmlDataToFacturisDesktopNomenclatorCsv } from '../mappers/desktopMappers.ts';

async function processForFacturisDesktop(filePath: any, callback: any) {
  try {
    const { filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory', 'promptToCreate'],
      title: 'Select a folder to save your files',
    });

    if (!filePaths || filePaths.length === 0) {
      throw new Error('No directory selected');
    }

    const baseOutputDir = filePaths[0];
    const markupPercentage = store.get('markupPercentage', 0);
    const markupPercentageNumber = Number(markupPercentage);

    fs.readFile(filePath, async (err, data) => {
      if (err) {
        console.error('Error reading XML file:', err);
        return callback(err);
      }

      const result: any = await parseXml(data);

      const issueDate = formatDate(result.Invoice['cbc:IssueDate']);
      const invoiceDir = path.join(baseOutputDir, `Factura_${issueDate}`);
      if (!fs.existsSync(invoiceDir)) {
        fs.mkdirSync(invoiceDir, { recursive: true });
      }

      const nirCsvData = await mapXmlDataToFacturisDesktopNirCsv(result, markupPercentageNumber);
      const nirOutputPath = path.join(invoiceDir, `NIR_${issueDate}.csv`);
      await writeCsvData(nirOutputPath, nirCsvData, callback);

      const nomenclatorCsvData = await mapXmlDataToFacturisDesktopNomenclatorCsv(result, markupPercentageNumber);
      const nomenclatorOutputPath = path.join(invoiceDir, `NOMENCLATOR_${issueDate}.csv`);
      await writeCsvData(nomenclatorOutputPath, nomenclatorCsvData, callback);
    });
  } catch (error: any) {
    console.error('Error in processForFacturisDesktop:', error.message);
    callback(error);
  }
}

export { processForFacturisDesktop };
