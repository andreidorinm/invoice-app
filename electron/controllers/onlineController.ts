import parseXml from '../services/xmlParser';
import writeCsvData from '../utils/csvWriter';
import formatDate from '../utils/formatDate';
import store from '../config/electronStore';
import fs from 'fs';
import path from 'path';
import { mapXmlDataToFacturisOnlineNirCsv, mapXmlDataToFacturisOnlineNomenclatorCsv } from '../mappers/onlineMappers';

async function processForFacturisOnline(filePath: any, saveDirectory: string, callback: any) {
  try {
    const baseOutputDir = saveDirectory;
    const markupPercentage = store.get('markupPercentage', 0);
    const markupPercentageNumber = Number(markupPercentage);

    fs.readFile(filePath, async (err, data) => {
      if (err) {
        console.error('Error reading XML file:', err);
        return callback(err);
      }

      const result: any = await parseXml(data);

      const invoice = result.Invoice;
      const supplierParty = invoice['cac:AccountingSupplierParty'];
      const party = supplierParty['cac:Party'];

      if (!party) {
        throw new Error('Unable to find Party information in the XML');
      }

      const partyName = party['cac:PartyName'];

      const issueDate = formatDate(invoice['cbc:IssueDate']);
      let supplierName = partyName['cbc:Name'];

      const folderName = `Factura_Facturis_Online_${supplierName}_${issueDate}`;
      const outputDir = path.join(baseOutputDir, folderName);

      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const nirCsvData = await mapXmlDataToFacturisOnlineNirCsv(result, markupPercentageNumber);
      const nirOutputPath = path.join(outputDir, `NIR_${supplierName}_${issueDate}.csv`);
      await writeCsvData(nirOutputPath, nirCsvData, callback);

      const nomenclatorCsvData = await mapXmlDataToFacturisOnlineNomenclatorCsv(result, markupPercentageNumber);
      const nomenclatorOutputPath = path.join(outputDir, `NOMENCLATOR_${supplierName}_${issueDate}.csv`);
      await writeCsvData(nomenclatorOutputPath, nomenclatorCsvData, callback);
    });
  } catch (error: any) {
    console.error('Error in processForFacturisOnline:', error.message);
    callback(error);
  }
}


export { processForFacturisOnline };
