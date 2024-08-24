import { CsvRow, JsonData } from '../../src/types/fileProcessor';
import store from '../config/electronStore';

export async function mapXmlDataToFacturisOnlineNirCsv(jsonData: JsonData, markupPercentage: number): Promise<CsvRow[]> {
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

export async function mapXmlDataToFacturisOnlineNomenclatorCsv(jsonData: JsonData, markupPercentage: number): Promise<CsvRow[]> {
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
