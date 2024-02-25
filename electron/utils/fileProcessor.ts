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

async function mapXmlDataToNomenclatorCsv(jsonData: JsonData): Promise<CsvRow[]> {
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
      'Cota TVA': (vatRate * 100).toFixed(2),
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

async function mapXmlDataToNirCsv(jsonData: JsonData, markupPercentage: number): Promise<CsvRow[]> {
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
      'Cota TVA intrare': vatRate * 100,
      'Cota TVA iesire': outputVatRate,
    };
    csvRows.push(row);
  });


  return csvRows;
}

async function writeCsvData(outputPath: string, csvData: CsvRow[], callback: (err: Error | null, message?: string) => void) {
  const csvStream = format({ headers: true });
  const writableStream = fs.createWriteStream(outputPath);

  writableStream.on('finish', () => {
    console.log(`CSV file has been written: ${outputPath}`);
    callback(null, `CSV file has been written: ${outputPath}`);
  });

  writableStream.on('error', (err) => {
    console.error('Error writing CSV file:', err);
    callback(err);
  });

  csvStream.pipe(writableStream);
  csvData.forEach(row => csvStream.write(row));
  csvStream.end();
}

async function parseAndTransform(filePath: string, callback: (err: Error | null, message?: string) => void): Promise<void> {
  try {
    const { filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory', 'promptToCreate'],
      title: 'Select a folder to save your files',
    });

    if (!filePaths || filePaths.length === 0) {
      throw new Error('No directory selected');
    }

    const outputDir = filePaths[0];

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const markupPercentage = store.get('markupPercentage', 0);
    const markupPercentageNumber = Number(markupPercentage);

    console.log(`Markup Percentage from Store: ${markupPercentageNumber}`);

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

        console.log('Parsed JSON from XML:', JSON.stringify(result, null, 2));

        const issueDate = formatDate(result.Invoice['cbc:IssueDate']);
        const nirCsvFileName = `NIR_${issueDate}.csv`;
        const nirOutputPath = path.join(outputDir, nirCsvFileName);
        const nomenclatorOutputFileName = `NOMENCLATOR_${issueDate}.csv`;
        const nomenclatorOutputPath = path.join(outputDir, nomenclatorOutputFileName);


        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        const nirCsvData = await mapXmlDataToNirCsv(result, markupPercentageNumber);
        await writeCsvData(nirOutputPath, nirCsvData, callback);

        const nomenclatorCsvData = await mapXmlDataToNomenclatorCsv(result);
        await writeCsvData(nomenclatorOutputPath, nomenclatorCsvData, callback);
      });
    });
  } catch (error: any) {
    console.error('Error in parseAndTransform:', error.message);
    callback(error);
  }
}

export { parseAndTransform };