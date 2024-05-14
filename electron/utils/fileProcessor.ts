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

async function mapXmlDataToFacturisDesktopNomenclatorCsv(jsonData: JsonData, markupPercentage: number): Promise<CsvRow[]> {
  const invoiceLines = jsonData.Invoice['cac:InvoiceLine'];
  const csvRows: CsvRow[] = [];
  const isVatPayer = store.get('isVatPayer', false);
  const markupMultiplier = 1 + markupPercentage / 100;

  const lines = Array.isArray(invoiceLines) ? invoiceLines : [invoiceLines];

  lines.forEach((line, index) => {
    const basePrice = parseFloat(line['cac:Price']['cbc:PriceAmount']['_']);
    const vatRate = line['cac:Item']['cac:ClassifiedTaxCategory']['cbc:Percent']
      ? parseFloat(line['cac:Item']['cac:ClassifiedTaxCategory']['cbc:Percent']) / 100
      : 0;

    let priceWithoutVat = basePrice;
    let priceWithVat = basePrice * (1 + vatRate);
    let sellingPriceWithoutVat, sellingPriceWithVat;

    if (isVatPayer) {
      sellingPriceWithoutVat = priceWithoutVat * markupMultiplier;
      sellingPriceWithVat = sellingPriceWithoutVat * (1 + vatRate);
    } else {
      sellingPriceWithVat = priceWithVat * markupMultiplier;
      sellingPriceWithoutVat = sellingPriceWithVat; // Since VAT details don't change the logic for non-payers, can keep same or use only sellingPriceWithVat
    }

    let outputVatRate = isVatPayer ? (vatRate * 100).toFixed(0) + '%' : 'Neplatitor de TVA';

    let row: CsvRow = {
      'Nr. crt.': index + 1,
      'Nume Produs': line['cac:Item']['cbc:Name'],
      'UM': 'BUC',
      'Pret fara TVA': sellingPriceWithoutVat.toFixed(2),
      'Pret cu TVA': sellingPriceWithVat.toFixed(2),
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
      'Cota TVA': outputVatRate,
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

    let priceWithoutVat = parseFloat(basePrice.toFixed(2));
    if (line['cac:Item']['cbc:Name'].includes("GARANTIE SGR")) {
      priceWithoutVat = 0.50;
    }
    const priceWithVat = basePrice * (1 + vatRate);

    const isVatPayer = store.get('isVatPayer', false);
    const markupMultiplier = 1 + markupPercentage / 100;

    let sellingPriceWithoutVat = priceWithoutVat * markupMultiplier;
    let sellingPriceWithVat = isVatPayer ? sellingPriceWithoutVat * (1 + vatRate) : sellingPriceWithoutVat; // Keep the same value if not a VAT payer


    const productName = line['cac:Item']['cbc:Name'];
    let quantity = line['cbc:InvoicedQuantity']['_'];


    let outputVatRate: any;
    if (isVatPayer) {
      outputVatRate = vatRate * 100 + '%';
    } else {
      outputVatRate = 'Neplatitor de TVA';
    }

    if (!isVatPayer) {
      sellingPriceWithVat = priceWithVat * markupMultiplier;
      sellingPriceWithoutVat = sellingPriceWithVat;
    } else {
      sellingPriceWithoutVat = priceWithoutVat * markupMultiplier;
      sellingPriceWithVat = sellingPriceWithoutVat * (1 + vatRate);
    }

    let row: CsvRow = {
      'Nr. crt.': index + 1,
      'Nume Produs': productName,
      'UM': 'BUC',
      'Cod Produs EAN': '',
      'Cantitate': quantity,
      'Pret achizitie fara TVA': priceWithoutVat.toFixed(3),
      'Pret achizitie cu TVA': priceWithVat.toFixed(3),
      'Pret vanzare fara TVA': sellingPriceWithoutVat.toFixed(2),
      'Pret vanzare cu TVA': sellingPriceWithVat.toFixed(2),
      'Lot': '',
      'Data expirarii (dd-mm-yyyy)': '',
      'Cota TVA intrare': (vatRate * 100).toFixed(0) + '%',
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

        const nomenclatorCsvData = await mapXmlDataToFacturisDesktopNomenclatorCsv(result, markupPercentageNumber);
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

    let priceWithoutVat = parseFloat(basePrice.toFixed(2));
    if (line['cac:Item']['cbc:Name'].includes("GARANTIE SGR")) {
      priceWithoutVat = 0.50;
    }
    const priceWithVat = basePrice * (1 + vatRate);
    const productName = line['cac:Item']['cbc:Name'];
    let quantity = line['cbc:InvoicedQuantity']['_'];

    const isVatPayer = store.get('isVatPayer', false); 

    let sellingPriceWithoutVat, sellingPriceWithVat, outputVatRate;
    if (!isVatPayer) {
      sellingPriceWithVat = priceWithVat * (1 + markupPercentage / 100);
      sellingPriceWithoutVat = sellingPriceWithVat; // Same as sellingPriceWithVat for non-VAT payers
      outputVatRate = 'Neplatitor de TVA'; // Displaying non-VAT payer status
    } else {
      sellingPriceWithoutVat = priceWithoutVat * (1 + markupPercentage / 100);
      sellingPriceWithVat = sellingPriceWithoutVat * (1 + vatRate);
      outputVatRate = (vatRate * 100).toFixed(0) + '%'; // Calculating VAT rate for VAT payers
    }

    let row: CsvRow = {
      'Nr. Crt.': index + 1,
      'Cod Produs': '',
      'Denumire Produs': productName,
      'UM': 'BUC',
      'Cant.': quantity,
      'Pret fara TVA. Achizitie': priceWithoutVat.toFixed(3),
      'Pret cu TVA. Achizitie': priceWithVat.toFixed(3),
      'TVA Achizitie': (vatRate * 100).toFixed(0) + '%',
      'Pret fara TVA. Vanzare': sellingPriceWithoutVat.toFixed(2),
      'Pret cu TVA. Vanzare': sellingPriceWithVat.toFixed(2),
      'TVA Vanzare': outputVatRate, // Adjusted VAT output rate display
      'Moneda Achizitie': 'RON',
      'Moneda Vanzare': 'RON',
      'Lot Produs': '',
      'Data Expirare': ''
    };
    csvRows.push(row);
  });

  return csvRows;
}

async function mapXmlDataToFacturisOnlineNomenclatorCsv(jsonData: JsonData, markupPercentage: number): Promise<CsvRow[]> {
  const invoiceLines = jsonData.Invoice['cac:InvoiceLine'];
  const csvRows: CsvRow[] = [];
  const isVatPayer = store.get('isVatPayer', false);
  const markupMultiplier = 1 + markupPercentage / 100;

  const lines = Array.isArray(invoiceLines) ? invoiceLines : [invoiceLines];

  lines.forEach((line, index) => {
    const basePrice = parseFloat(line['cac:Price']['cbc:PriceAmount']['_']);
    const vatRate = line['cac:Item']['cac:ClassifiedTaxCategory']['cbc:Percent']
      ? parseFloat(line['cac:Item']['cac:ClassifiedTaxCategory']['cbc:Percent']) / 100
      : 0;

    const priceWithoutVat = basePrice;
    const priceWithVat = basePrice * (1 + vatRate);

    let sellingPriceWithoutVat, sellingPriceWithVat, outputVatRate;

    if (!isVatPayer) {
      sellingPriceWithVat = priceWithVat * markupMultiplier;
      sellingPriceWithoutVat = sellingPriceWithVat; // For non-VAT payers, might typically be unused or set to base price
      outputVatRate = 'Neplatitor de TVA'; // Displaying non-VAT payer status
    } else {
      sellingPriceWithoutVat = priceWithoutVat * markupMultiplier;
      sellingPriceWithVat = sellingPriceWithoutVat * (1 + vatRate);
      outputVatRate = (vatRate * 100).toFixed(0) + '%'; // Calculating VAT rate for VAT payers
    }

    let row: CsvRow = {
      'Ctr.': index + 1,
      'Produs': line['cac:Item']['cbc:Name'],
      'UM': 'BUC',
      'Pret fara TVA': sellingPriceWithoutVat.toFixed(2),
      'Pret cu TVA': sellingPriceWithVat.toFixed(2),
      'Moneda': line['cac:Price']['cbc:PriceAmount']['currencyID'] || 'RON',
      'Cota TVA': outputVatRate, // Adjusted VAT output rate display
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

        const nomenclatorCsvData = await mapXmlDataToFacturisOnlineNomenclatorCsv(result, markupPercentageNumber);
        await writeCsvData(nomenclatorOutputPath, nomenclatorCsvData, callback);
      });
    });
  } catch (error: any) {
    console.error('Error in processForFacturisOnline:', error.message);
    callback(error);
  }
}


export { processForFacturisDesktop, processForFacturisOnline };
