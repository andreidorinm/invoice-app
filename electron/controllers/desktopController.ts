import { XMLParser } from 'fast-xml-parser';
import writeCsvData from '../utils/csvWriter';
import formatDate from '../utils/formatDate';
import store from '../config/electronStore';
import fs from 'fs/promises';
import path from 'path';
import { mapXmlDataToFacturisDesktopNirCsv, mapXmlDataToFacturisDesktopNomenclatorCsv } from '../mappers/desktopMappers';

async function processForFacturisDesktop(filePath: any, saveDirectory: string, callback: any) {
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

    const supplierParty = invoice['AccountingSupplierParty'];
    const party = supplierParty['Party'];

    if (!party) {
      throw new Error('Unable to find Party information in the XML');
    }

    const issueDate = formatDate(invoice['IssueDate']);
    const supplierName = party.PartyName?.Name || party.PartyLegalEntity?.RegistrationName;


    const invoiceDir = path.join(baseOutputDir, `Factura_Facturis_Desktop_${supplierName}_${issueDate}`);

    try {
      await fs.access(invoiceDir);
    } catch {
      await fs.mkdir(invoiceDir, { recursive: true });
    }

    const nirCsvData = await mapXmlDataToFacturisDesktopNirCsv(result, markupPercentageNumber);
    const nirOutputPath = path.join(invoiceDir, `NIR_${supplierName}_${issueDate}.csv`);
    await writeCsvData(nirOutputPath, nirCsvData, callback);

    const nomenclatorCsvData = await mapXmlDataToFacturisDesktopNomenclatorCsv(result, markupPercentageNumber);
    const nomenclatorOutputPath = path.join(invoiceDir, `NOMENCLATOR_${supplierName}_${issueDate}.csv`);
    await writeCsvData(nomenclatorOutputPath, nomenclatorCsvData, callback);
  } catch (error: any) {
    console.error('Error in processForFacturisDesktop:', error.message);
    callback(error);
  }
}

export { processForFacturisDesktop };
