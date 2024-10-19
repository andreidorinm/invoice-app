import { CsvRow, JsonData } from '../../src/types/fileProcessor';
import store from '../config/electronStore';

export async function mapXmlDataToFacturisOnlineNirCsv(
  jsonData: JsonData,
  markupPercentage: number
): Promise<CsvRow[]> {
  const invoiceLines = jsonData.Invoice.InvoiceLine;
  const csvRows: CsvRow[] = [];

  const lines = Array.isArray(invoiceLines) ? invoiceLines : [invoiceLines];
  const isVatPayer = store.get('isVatPayer', false);
  const markupMultiplier = 1 + markupPercentage / 100;

  lines.forEach((line, index) => {
    const priceObj = line.Price;
    const priceAmountObj = priceObj?.PriceAmount;
    const basePrice = priceAmountObj ? parseFloat(priceAmountObj) : 0;

    const itemObj = line.Item;
    const itemName = itemObj?.Name || 'Unknown Product';
    const classifiedTaxCategory = itemObj?.ClassifiedTaxCategory;
    const vatRate = classifiedTaxCategory?.Percent
      ? parseFloat(classifiedTaxCategory.Percent) / 100
      : 0;

    let priceWithoutVat = parseFloat(basePrice.toFixed(2));
    if (itemName.includes('GARANTIE SGR')) {
      priceWithoutVat = 0.5;
    }
    const priceWithVat = basePrice * (1 + vatRate);
    const productName = itemName;
    const invoicedQuantityObj = line.InvoicedQuantity;
    const quantity = invoicedQuantityObj ? parseFloat(invoicedQuantityObj) : 0;

    const standardItemIdentification = itemObj?.StandardItemIdentification;
    const productCode = standardItemIdentification?.ID || '';

    let sellingPriceWithoutVat, sellingPriceWithVat, outputVatRate;

    if (!isVatPayer) {
      sellingPriceWithVat = priceWithVat * markupMultiplier;
      sellingPriceWithoutVat = sellingPriceWithVat;
      outputVatRate = 'Neplatitor de TVA';
    } else {
      sellingPriceWithoutVat = priceWithoutVat * markupMultiplier;
      sellingPriceWithVat = sellingPriceWithoutVat * (1 + vatRate);
      outputVatRate = (vatRate * 100).toFixed(0) + '%';
    }

    let row: CsvRow = {
      'Nr. Crt.': index + 1,
      'Cod Produs': productCode,
      'Denumire Produs': productName,
      'UM': 'BUC',
      'Cant.': quantity.toString(),
      'Pret fara TVA. Achizitie': priceWithoutVat.toFixed(3),
      'Pret cu TVA. Achizitie': priceWithVat.toFixed(3),
      'TVA Achizitie': (vatRate * 100).toFixed(0) + '%',
      'Pret fara TVA. Vanzare': sellingPriceWithoutVat.toFixed(2),
      'Pret cu TVA. Vanzare': sellingPriceWithVat.toFixed(2),
      'TVA Vanzare': outputVatRate,
      'Moneda Achizitie': priceAmountObj?.['@_currencyID'] || 'RON',
      'Moneda Vanzare': 'RON',
      'Lot Produs': '',
      'Data Expirare': '',
    };
    csvRows.push(row);
  });

  return csvRows;
}

export async function mapXmlDataToFacturisOnlineNomenclatorCsv(
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
    const priceAmountObj = priceObj?.PriceAmount;
    const basePrice = priceAmountObj ? parseFloat(priceAmountObj) : 0;

    const itemObj = line.Item;
    const itemName = itemObj?.Name || 'Unknown Product';
    const classifiedTaxCategory = itemObj?.ClassifiedTaxCategory;
    const vatRate = classifiedTaxCategory?.Percent
      ? parseFloat(classifiedTaxCategory.Percent) / 100
      : 0;

    const priceWithoutVat = basePrice;
    const priceWithVat = basePrice * (1 + vatRate);

    const standardItemIdentification = itemObj?.StandardItemIdentification;
    const productCode = standardItemIdentification?.ID || '';

    let sellingPriceWithoutVat, sellingPriceWithVat, outputVatRate;

    if (!isVatPayer) {
      sellingPriceWithVat = priceWithVat * markupMultiplier;
      sellingPriceWithoutVat = sellingPriceWithVat;
      outputVatRate = 'Neplatitor de TVA';
    } else {
      sellingPriceWithoutVat = priceWithoutVat * markupMultiplier;
      sellingPriceWithVat = sellingPriceWithoutVat * (1 + vatRate);
      outputVatRate = (vatRate * 100).toFixed(0) + '%';
    }

    let row: CsvRow = {
      'Ctr.': index + 1,
      'Produs': itemName,
      'UM': 'BUC',
      'Pret fara TVA': sellingPriceWithoutVat.toFixed(2),
      'Pret cu TVA': sellingPriceWithVat.toFixed(2),
      'Moneda': priceAmountObj?.['@_currencyID'] || 'RON',
      'Cota TVA': outputVatRate,
      'Cod EAN': productCode,
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
      'Id Intern': '',
    };
    csvRows.push(row);
  });

  return csvRows;
}



