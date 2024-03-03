import * as xml2js from 'xml2js';
import { format } from 'fast-csv';
import * as fs from 'fs';
import * as path from 'path';
import { dialog } from 'electron'; 
import { CsvRow, JsonData } from '../../src/types/fileProcessor';
import electronStore from 'electron-store';

const store = new electronStore();

function formatDate(ymdDate: string): string {
  const [year, month, day] = ymdDate.split('-');
  return `${day}-${month}-${year}`;
}

async function mapXmlDataToFacturisDesktopNomenclatorCsv(jsonData: JsonData): Promise<CsvRow[]> {
  const invoiceLines = jsonData.Invoice['cac:InvoiceLine'];
  const csvRows: CsvRow[] = [];

  const lines = Array.isArray(invoiceLines) ? invoiceLines : [invoiceLines];

  lines.forEach((line, index) => {
    const basePrice = parseFloat(line['cac:Price']['cbc:PriceAmount']['_']);
    const vatRate = line['cac:Item']['cac:ClassifiedTaxCategory']['cbc:Percent']
      ? parseFloat(line['cac:Item']['cac:ClassifiedTaxCategory']['cbc:Percent']) / 100
      : 0;

    let row: CsvRow = {
      'Nr. crt.': index + 1,
      'Nume Produs': line['cac:Item']['cbc:Name'],
      'UM': 'BUC',
      'Pret fara TVA': basePrice.toFixed(2),
      'Pret cu TVA': (basePrice * (1 + vatRate)).toFixed(2),
      'Moneda': line['cac:Price']['cbc:PriceAmount']['currencyID'] || 'RON',
      'Cod EAN': '',
      'Cod Produs': '',
      'Observatii 1': '',
      'Observatii 2': '',
      'Tip': 'Produs',
      'Pret 2 fara TVA': '',
      'Pret 2 cu TVA': '',
      'Pret 3 fara TVA': '',
      'Pret 3 cu TVA': '',
      'Cota TVA': (vatRate * 100).toFixed(2) + '%',
      'Categorie Produse': '',
      'Accize': '',
      'Greutate': '',
      'Observatii 3': '',
      'Observatii 4': '' 
    };
    csvRows.push(row);
  });

  return csvRows;
}

async function mapXmlDataToFacturisDesktopNirCsv(jsonData: JsonData, markupPercentage: number): Promise<CsvRow[]> {
  const invoiceLines = jsonData.Invoice['cac:InvoiceLine'];
  const csvRows: CsvRow[] = [];

  const lines = Array.isArray(invoiceLines) ? invoiceLines : [invoiceLines];

  lines.forEach((line, index) => {
    const basePrice = parseFloat(line['cac:Price']['cbc:PriceAmount']['_']);
    const vatRate = line['cac:Item']['cac:ClassifiedTaxCategory']['cbc:Percent']
      ? parseFloat(line['cac:Item']['cac:ClassifiedTaxCategory']['cbc:Percent']) / 100
      : 0;

    if (isNaN(basePrice) || isNaN(vatRate)) {
      console.error(`Invalid number encountered. Base Price: ${basePrice}, VAT Rate: ${vatRate}`);
      return;
    }

    const priceWithoutVat = basePrice;
    const priceWithVat = basePrice * (1 + vatRate);

    const sellingPriceWithoutVat = priceWithoutVat * (1 + markupPercentage / 100);
    const sellingPriceWithVat = sellingPriceWithoutVat * (1 + vatRate);

    const isVatPayer = store.get('isVatPayer', false);

    let outputVatRate: any;
    if (isVatPayer) {
      outputVatRate = vatRate * 100;
    } else {
      outputVatRate = 'neplatitor de tva';
    }

    let row: CsvRow = {
      'Nr. crt.': index + 1,
      'Nume Produs': line['cac:Item']['cbc:Name'],
      'UM': 'BUC',
      'Cod Produs EAN': '',
      'Cantitate': line['cbc:InvoicedQuantity']['_'],
      'Pret achizitie fara TVA': priceWithoutVat.toFixed(2),
      'Pret achizitie cu TVA': priceWithVat.toFixed(2),
      'Pret vanzare fara TVA': sellingPriceWithoutVat.toFixed(2),
      'Pret vanzare cu TVA': sellingPriceWithVat.toFixed(2),
      'Lot': '',
      'Data expirarii (dd-mm-yyyy)': '',
      'Cota TVA intrare': vatRate * 100 + '%',
      'Cota TVA iesire': outputVatRate + '%',
    };
    csvRows.push(row);
  });


  return csvRows;
}

async function writeCsvData(outputPath: string, csvData: CsvRow[], callback: (err: Error | null, message?: string) => void) {
  const csvStream = format({ headers: true });
  const writableStream = fs.createWriteStream(outputPath);

  writableStream.on('finish', () => {
    console.log(`Fisierul Excel a fost salvat la: ${outputPath}`);
    callback(null, `Fisierul Excel a fost salvat la: ${outputPath}`);
  });

  writableStream.on('error', (err) => {
    console.error('Eroare la salvarea fisierului:', err);
    callback(err);
  });

  csvStream.pipe(writableStream);
  csvData.forEach(row => csvStream.write(row));
  csvStream.end();
}

async function processForFacturisDesktop(filePath: string, callback: (err: Error | null, message?: string) => void): Promise<void> {
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

      xml2js.parseString(data, { explicitArray: false, mergeAttrs: true }, async (err: any, result: any) => {
        if (err) {
          console.error('Error parsing XML:', err);
          return callback(err);
        }

        const issueDate = formatDate(result.Invoice['cbc:IssueDate']);
        const invoiceDir = path.join(baseOutputDir, `Factura_${issueDate}`);
        if (!fs.existsSync(invoiceDir)) {
          fs.mkdirSync(invoiceDir, { recursive: true });
        }

        const nirCsvFileName = `NIR_${issueDate}.csv`;
        const nirOutputPath = path.join(invoiceDir, nirCsvFileName);
        const nomenclatorOutputFileName = `NOMENCLATOR_${issueDate}.csv`;
        const nomenclatorOutputPath = path.join(invoiceDir, nomenclatorOutputFileName);

        const nirCsvData = await mapXmlDataToFacturisDesktopNirCsv(result, markupPercentageNumber);
        await writeCsvData(nirOutputPath, nirCsvData, callback);

        const nomenclatorCsvData = await mapXmlDataToFacturisDesktopNomenclatorCsv(result);
        await writeCsvData(nomenclatorOutputPath, nomenclatorCsvData, callback);
      });
    });
  } catch (error: any) {
    console.error('Error in processForFacturisDesktop:', error.message);
    callback(error);
  }
}

async function mapXmlDataToFacturisOnlineNirCsv(jsonData: JsonData, markupPercentage: number): Promise<CsvRow[]> {
  const invoiceLines = jsonData.Invoice['cac:InvoiceLine'];
  const csvRows: CsvRow[] = [];
  
  const lines = Array.isArray(invoiceLines) ? invoiceLines : [invoiceLines];
  
  lines.forEach((line, index) => {
    const basePrice = parseFloat(line['cac:Price']['cbc:PriceAmount']['_']);
    const vatRate = line['cac:Item']['cac:ClassifiedTaxCategory']['cbc:Percent']
      ? parseFloat(line['cac:Item']['cac:ClassifiedTaxCategory']['cbc:Percent']) / 100
      : 0;
    const priceWithoutVat = basePrice;
    const priceWithVat = basePrice * (1 + vatRate);
    const sellingPriceWithoutVat = priceWithoutVat * (1 + markupPercentage / 100);
    const sellingPriceWithVat = sellingPriceWithoutVat * (1 + vatRate);

    let row: CsvRow = {
      'Nr. Crt.': index + 1,
      'Cod Produs': '',
      'Denumire Produs': line['cac:Item']['cbc:Name'],
      'UM': 'BUC',
      'Cant.': line['cbc:InvoicedQuantity']['_'],
      'Pret fara TVA. Achizitie': priceWithoutVat.toFixed(2),
      'Pret cu TVA. Achizitie': priceWithVat.toFixed(2),
      'TVA Achizitie': (vatRate * 100).toFixed(0) + '%',
      'Pret fara TVA. Vanzare': sellingPriceWithoutVat.toFixed(2),
      'Pret cu TVA. Vanzare': sellingPriceWithVat.toFixed(2),
      'TVA Vanzare': (vatRate * 100).toFixed(0) + '%',
      'Moneda Achizitie': 'RON',
      'Moneda Vanzare': 'RON',
      'Lot Produs': '',
      'Data Expirare': ''
    };
    csvRows.push(row);
  });

  return csvRows;
}

async function mapXmlDataToFacturisOnlineNomenclatorCsv(jsonData: JsonData): Promise<CsvRow[]> {
  const invoiceLines = jsonData.Invoice['cac:InvoiceLine'];
  const csvRows: CsvRow[] = [];

  const lines = Array.isArray(invoiceLines) ? invoiceLines : [invoiceLines];

  lines.forEach((line, index) => {
    const basePrice = parseFloat(line['cac:Price']['cbc:PriceAmount']['_']);
    const vatRate = line['cac:Item']['cac:ClassifiedTaxCategory']['cbc:Percent'] ? parseFloat(line['cac:Item']['cac:ClassifiedTaxCategory']['cbc:Percent']) / 100 : 0;
    const priceWithVat = basePrice * (1 + vatRate);

    let row: CsvRow = {
      'Ctr.': index + 1,
      'Produs': line['cac:Item']['cbc:Name'],
      'UM': 'BUC',
      'Pret fara TVA': basePrice.toFixed(2),
      'Pret cu TVA': priceWithVat.toFixed(2),
      'Moneda': line['cac:Price']['cbc:PriceAmount']['currencyID'] || 'RON',
      'Cota TVA': (vatRate * 100).toFixed(2) + '%',
      'Cod EAN': '',
      'Cod SKU': '', 
      'Alt Cod': '',
      'Categorie Produs': '', 
      'Observatii 1': '',
      'Observatii 2': '',
      'Observatii 3': '',
      'Tip': 'Produs',
      'Numar imagini': '',
      'Discount Cantitate': '',
      'Produs Asociat': '',
      'Greutate (Kg)': '',
      'Observatii 4': '',
      'Observatii 5': '',
      'Observatii 6': '',
      'Id Intern': ''
    };
    csvRows.push(row);
  });

  return csvRows;
}


async function processForFacturisOnline(filePath: string, callback: (err: Error | null, message?: string) => void): Promise<void> {
  try {
    const markupPercentage = store.get('markupPercentage', 0);
    const markupPercentageNumber = Number(markupPercentage);

    fs.readFile(filePath, async (err, data) => {
      if (err) {
        console.error('Error reading XML file:', err);
        return callback(err);
      }

      xml2js.parseString(data, { explicitArray: false, mergeAttrs: true }, async (err: any, result: any) => {
        if (err) {
          console.error('Error parsing XML:', err);
          return callback(err);
        }

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

        const nirCsvFileName = `NIR_${issueDate}.csv`;
        const nirOutputPath = path.join(outputDir, nirCsvFileName);
        const nomenclatorOutputFileName = `NOMENCLATOR_${issueDate}.csv`;
        const nomenclatorOutputPath = path.join(outputDir, nomenclatorOutputFileName);

        console.log(`Markup Percentage from Store: ${markupPercentageNumber}`);

        const nirCsvData = await mapXmlDataToFacturisOnlineNirCsv(result, markupPercentageNumber);
        await writeCsvData(nirOutputPath, nirCsvData, callback);

        const nomenclatorCsvData = await mapXmlDataToFacturisOnlineNomenclatorCsv(result);
        await writeCsvData(nomenclatorOutputPath, nomenclatorCsvData, callback);
      });
    });
  } catch (error: any) {
    console.error('Error in processForFacturisOnline:', error.message);
    callback(error);
  }
}


export { processForFacturisDesktop, processForFacturisOnline };
