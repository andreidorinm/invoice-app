import { CsvRow, JsonData } from '../../src/types/fileProcessor';
import store from '../config/electronStore';

export async function mapXmlDataToFacturisDesktopNomenclatorCsv(jsonData: JsonData, markupPercentage: number): Promise<CsvRow[]> {
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

export async function mapXmlDataToFacturisDesktopNirCsv(jsonData: JsonData, markupPercentage: number): Promise<CsvRow[]> {
  const invoiceLines = jsonData.Invoice['cac:InvoiceLine'];
  const csvRows: CsvRow[] = [];

  const lines = Array.isArray(invoiceLines) ? invoiceLines : [invoiceLines];

  lines.forEach((line, index) => {
    let basePrice = parseFloat(line['cac:Price']['cbc:PriceAmount']['_']);
    let vatRate = line['cac:Item']['cac:ClassifiedTaxCategory']['cbc:Percent']
      ? parseFloat(line['cac:Item']['cac:ClassifiedTaxCategory']['cbc:Percent']) / 100
      : 0;

    let priceWithoutVat = basePrice;
    let priceWithVat = parseFloat((basePrice * (1 + vatRate)).toFixed(4)); // Convert back to number after rounding

    const isVatPayer = store.get('isVatPayer', false);
    const markupMultiplier = 1 + markupPercentage / 100;

    // Check for special case items
    if (line['cac:Item']['cbc:Name'].includes("GARANTIE SGR")) {
      priceWithoutVat = 0.50;
      priceWithVat = 0.50;
      vatRate = 0; // Set VAT rate to 0% for this specific item
    }

    let sellingPriceWithoutVat = parseFloat((priceWithoutVat * markupMultiplier).toFixed(3)); // Convert back to number after rounding
    let sellingPriceWithVat = parseFloat((sellingPriceWithoutVat * (1 + vatRate)).toFixed(4)); // Convert back to number after rounding

    if (!isVatPayer) {
      sellingPriceWithVat = parseFloat((priceWithVat * markupMultiplier).toFixed(4)); // Convert back to number after rounding
      sellingPriceWithoutVat = sellingPriceWithVat; // Non-VAT payers use the same value for without VAT
    }

    const productName = line['cac:Item']['cbc:Name'];
    let quantity = parseFloat(line['cbc:InvoicedQuantity']['_']); // Ensure quantity is a number

    let outputVatRate = isVatPayer ? (vatRate * 100).toFixed(0) + '%' : 'Neplatitor de TVA';

    let row: CsvRow = {
      'Nr. crt.': index + 1,
      'Nume Produs': productName,
      'UM': 'BUC',
      'Cod Produs EAN': '',
      'Cantitate': quantity.toString(),
      'Pret achizitie fara TVA': priceWithoutVat.toFixed(3),
      'Pret achizitie cu TVA': priceWithVat.toString(),
      'Pret vanzare fara TVA': sellingPriceWithoutVat.toString(),
      'Pret vanzare cu TVA': sellingPriceWithVat.toString(),
      'Lot': '',
      'Data expirarii (dd-mm-yyyy)': '',
      'Cota TVA intrare': (vatRate * 100).toFixed(0) + '%',
      'Cota TVA iesire': outputVatRate,
    };
    csvRows.push(row);
  });

  return csvRows;
}

