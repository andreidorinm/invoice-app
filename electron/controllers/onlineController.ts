import { XMLParser } from 'fast-xml-parser';
import writeCsvData from '../utils/csvWriter';
import formatDate from '../utils/formatDate';
import store from '../config/electronStore';
import fs from 'fs/promises';
import path from 'path';
import { mapXmlDataToFacturisOnlineNirCsv, mapXmlDataToFacturisOnlineNomenclatorCsv } from '../mappers/onlineMappers';

async function processForFacturisOnline(filePath: any, saveDirectory: string, callback: any) {
  try {
    const baseOutputDir = saveDirectory;
    const markupPercentage = store.get('markupPercentage', 0);
    const markupPercentageNumber = Number(markupPercentage);

    const data = await fs.readFile(filePath);
    const xmlContent = data.toString();

    const parserOptions = {
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      allowBooleanAttributes: true,
      parseNodeValue: true,
      parseAttributeValue: true,
      trimValues: true,
      removeNSPrefix: true,
    };

    const parser = new XMLParser(parserOptions);
    const result = parser.parse(xmlContent);

    const invoice = result.Invoice;

    const supplierParty = invoice.AccountingSupplierParty;
    const party = supplierParty.Party;

    if (!party) {
      throw new Error('Unable to find Party information in the XML');
    }

    const supplierName = party.PartyName?.Name || party.PartyLegalEntity?.RegistrationName;

    if (!supplierName) {
      throw new Error('Unable to find supplier name in the XML');
    }

    const issueDate = formatDate(invoice.IssueDate);

    const folderName = `Factura_Facturis_Online_${supplierName}_${issueDate}`;
    const outputDir = path.join(baseOutputDir, folderName);

    try {
      await fs.access(outputDir);
    } catch {
      await fs.mkdir(outputDir, { recursive: true });
    }

    const nirCsvData = await mapXmlDataToFacturisOnlineNirCsv(result, markupPercentageNumber);
    const nirOutputPath = path.join(outputDir, `NIR_${supplierName}_${issueDate}.csv`);
    await writeCsvData(nirOutputPath, nirCsvData, callback);

    const nomenclatorCsvData = await mapXmlDataToFacturisOnlineNomenclatorCsv(result, markupPercentageNumber);
    const nomenclatorOutputPath = path.join(outputDir, `NOMENCLATOR_${supplierName}_${issueDate}.csv`);
    await writeCsvData(nomenclatorOutputPath, nomenclatorCsvData, callback);
  } catch (error: any) {
    console.error('Error in processForFacturisOnline:', error.message);
    callback(error);
  }
}

export { processForFacturisOnline };
