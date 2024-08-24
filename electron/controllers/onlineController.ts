import parseXml from '../services/xmlParser';
import writeCsvData from '../utils/csvWriter';
import formatDate from '../utils/formatDate';
import store from '../config/electronStore';
import { dialog } from 'electron';
import fs from 'fs';
import path from 'path';
import { mapXmlDataToFacturisOnlineNirCsv, mapXmlDataToFacturisOnlineNomenclatorCsv } from '../mappers/onlineMappers';

async function processForFacturisOnline(filePath: any, callback: any) {
  try {
    const markupPercentage = store.get('markupPercentage', 0);
    const markupPercentageNumber = Number(markupPercentage);

    fs.readFile(filePath, async (err, data) => {
      if (err) {
        console.error('Error reading XML file:', err);
        return callback(err);
      }

      const result: any = await parseXml(data);

      const issueDate = formatDate(result.Invoice['cbc:IssueDate']);
      const folderName = `Factura_${issueDate}`;
      const { filePaths } = await dialog.showOpenDialog({
        properties: ['openDirectory', 'createDirectory', 'promptToCreate'],
        title: 'Select a folder to save your files',
      });

      if (!filePaths || filePaths.length === 0) {
        throw new Error('No directory selected');
      }

      const outputDir = path.join(filePaths[0], folderName);

      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const nirCsvData = await mapXmlDataToFacturisOnlineNirCsv(result, markupPercentageNumber);
      const nirOutputPath = path.join(outputDir, `NIR_${issueDate}.csv`);
      await writeCsvData(nirOutputPath, nirCsvData, callback);

      const nomenclatorCsvData = await mapXmlDataToFacturisOnlineNomenclatorCsv(result, markupPercentageNumber);
      const nomenclatorOutputPath = path.join(outputDir, `NOMENCLATOR_${issueDate}.csv`);
      await writeCsvData(nomenclatorOutputPath, nomenclatorCsvData, callback);
    });
  } catch (error: any) {
    console.error('Error in processForFacturisOnline:', error.message);
    callback(error);
  }
}

export { processForFacturisOnline };
