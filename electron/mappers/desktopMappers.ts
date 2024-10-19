import { CsvRow, JsonData } from '../../src/types/fileProcessor';
import store from '../config/electronStore';

export async function mapXmlDataToFacturisDesktopNomenclatorCsv(
  jsonData: JsonData,
  markupPercentage: number
): Promise<CsvRow[]> {
  const invoiceLines = jsonData.Invoice.InvoiceLine;
  const csvRows: CsvRow[] = [];
  const isVatPayer = store.get('isVatPayer', false);
  const markupMultiplier = 1 + markupPercentage / 100;

  const lines = Array.isArray(invoiceLines) ? invoiceLines : [invoiceLines];

  lines.forEach((line, index) => {
    const priceObj = line.Price;
    const itemObj = line.Item;
    const priceAmountObj = priceObj?.PriceAmount;
    const itemName = itemObj?.Name;
    const classifiedTaxCategory = itemObj?.ClassifiedTaxCategory;
    const taxPercent = classifiedTaxCategory?.Percent
      ? parseFloat(classifiedTaxCategory.Percent) / 100
      : 0;

    const basePrice = priceAmountObj ? parseFloat(priceAmountObj) : 0;
    const vatRate = taxPercent;

    let priceWithoutVat = basePrice;
    let priceWithVat = basePrice * (1 + vatRate);
    let sellingPriceWithoutVat, sellingPriceWithVat;

    if (isVatPayer) {
      sellingPriceWithoutVat = priceWithoutVat * markupMultiplier;
      sellingPriceWithVat = sellingPriceWithoutVat * (1 + vatRate);
    } else {
      sellingPriceWithVat = priceWithVat * markupMultiplier;
      sellingPriceWithoutVat = sellingPriceWithVat;
    }

    const standardItemIdentification = itemObj?.StandardItemIdentification;
    const productCode =
      standardItemIdentification?.ID || '';

    let outputVatRate = isVatPayer ? (vatRate * 100).toFixed(0) + '%' : 'Neplatitor de TVA';

    let row: CsvRow = {
      'Nr. crt.': index + 1,
      'Nume Produs': itemName || 'Unknown Product',
      'UM': 'BUC',
      'Pret fara TVA': sellingPriceWithoutVat.toFixed(2),
      'Pret cu TVA': sellingPriceWithVat.toFixed(2),
      'Moneda': priceAmountObj?.['@_currencyID'] || 'RON',
      'Cod EAN': '',
      'Cod Produs': productCode,
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

export async function mapXmlDataToFacturisDesktopNirCsv(
  jsonData: JsonData,
  markupPercentage: number
): Promise<CsvRow[]> {
  const invoiceLines = jsonData.Invoice.InvoiceLine;
  const csvRows: CsvRow[] = [];

  const lines = Array.isArray(invoiceLines) ? invoiceLines : [invoiceLines];

  lines.forEach((line, index) => {
    const priceObj = line.Price;
    const itemObj = line.Item;
    const priceAmountObj = priceObj?.PriceAmount;
    const itemName = itemObj?.Name;
    const classifiedTaxCategory = itemObj?.ClassifiedTaxCategory;
    const taxPercent = classifiedTaxCategory?.Percent
      ? parseFloat(classifiedTaxCategory.Percent) / 100
      : 0;

    let basePrice = priceAmountObj ? parseFloat(priceAmountObj) : 0;
    let vatRate = taxPercent;

    let priceWithoutVat = basePrice;
    let priceWithVat = parseFloat((basePrice * (1 + vatRate)).toFixed(4));

    const isVatPayer = store.get('isVatPayer', false);
    const markupMultiplier = 1 + markupPercentage / 100;

    if (itemName?.includes("GARANTIE SGR")) {
      priceWithoutVat = 0.50;
      priceWithVat = 0.50;
      vatRate = 0;
    }

    let sellingPriceWithoutVat = parseFloat((priceWithoutVat * markupMultiplier).toFixed(3));
    let sellingPriceWithVat = parseFloat((sellingPriceWithoutVat * (1 + vatRate)).toFixed(4));

    if (!isVatPayer) {
      sellingPriceWithVat = parseFloat((priceWithVat * markupMultiplier).toFixed(4));
      sellingPriceWithoutVat = sellingPriceWithVat;
    }

    const standardItemIdentification = itemObj?.StandardItemIdentification;
    const productCode =
      standardItemIdentification?.ID || '';

    const invoicedQuantityObj = line.InvoicedQuantity;
    let quantity = parseFloat(invoicedQuantityObj);

    let outputVatRate = isVatPayer ? (vatRate * 100).toFixed(0) + '%' : 'Neplatitor de TVA';

    let row: CsvRow = {
      'Nr. crt.': index + 1,
      'Nume Produs': itemName || 'Unknown Product',
      'UM': 'BUC',
      'Cod Produs EAN': productCode,
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
