import { CsvRow, JsonData } from '../../src/types/fileProcessor';
import store from '../config/electronStore';

export async function mapXmlDataToFacturisDesktopNirCsv(
  jsonData: JsonData,
  markupPercentage: number
): Promise<CsvRow[]> {
  const invoiceLines = jsonData.Invoice.InvoiceLine;
  const csvRows: CsvRow[] = [];

  const lines = Array.isArray(invoiceLines) ? invoiceLines : [invoiceLines];

  const isVatPayer = store.get('isVatPayer', false);
  const originalMarkupPercentage = markupPercentage; // Preserve original markup

  lines.forEach((line, index) => {
    const priceObj = line.Price;
    const itemObj = line.Item;
    const priceAmountObj = priceObj?.PriceAmount?.['#text'] || priceObj?.PriceAmount || 0;
    const itemName = itemObj?.Name || 'Unknown Product';
    const classifiedTaxCategory = itemObj?.ClassifiedTaxCategory;
    const taxPercent = classifiedTaxCategory?.Percent
      ? parseFloat(classifiedTaxCategory.Percent) / 100
      : 0;

    let basePrice = priceAmountObj ? parseFloat(priceAmountObj) : 0;
    let vatRate = taxPercent;

    const invoicedQuantityObj = line.InvoicedQuantity;
    let quantity = parseFloat(invoicedQuantityObj?.['#text'] || invoicedQuantityObj || 1);

    let priceWithoutVat = basePrice;
    let priceWithVat = parseFloat((basePrice * (1 + vatRate)).toFixed(4));

    let sellingPriceWithoutVat: number = 0;
    let sellingPriceWithVat: number = 0;

    if (itemName.toUpperCase().includes('GARANTIE SGR')) {
      if (priceWithoutVat === 0.50) {
        markupPercentage = 0;
        vatRate = 0;
        priceWithVat = 0.50;
        sellingPriceWithoutVat = 0.50;
        sellingPriceWithVat = 0.50;
      } else {
        const multiplierMatch = itemName.match(/(\d+)X0\.5LEI/i);
        if (multiplierMatch) {
          const multiplier = parseInt(multiplierMatch[1], 10);
          quantity = multiplier * quantity;
          priceWithoutVat = parseFloat((basePrice / quantity).toFixed(4));
          priceWithVat = priceWithoutVat; // No VAT for Garantie SGR
          vatRate = 0;
        }
      }
    } else {
      const markupMultiplier = 1 + markupPercentage / 100;
      sellingPriceWithoutVat = parseFloat((priceWithoutVat * markupMultiplier).toFixed(3));
      sellingPriceWithVat = parseFloat((sellingPriceWithoutVat * (1 + vatRate)).toFixed(4));

      if (!isVatPayer) {
        sellingPriceWithVat = parseFloat((priceWithVat * markupMultiplier).toFixed(4));
        sellingPriceWithoutVat = sellingPriceWithVat;
      }
    }

    const productCode = itemObj?.StandardItemIdentification?.ID?.['#text'] || '';

    let row: CsvRow = {
      'Nr. crt.': index + 1,
      'Nume Produs': itemName,
      'UM': 'BUC',
      'Cod Produs EAN': productCode,
      'Cantitate': quantity.toString(),
      'Pret achizitie fara TVA': priceWithoutVat.toFixed(4),
      'Pret achizitie cu TVA': priceWithVat.toFixed(4),
      'Pret vanzare fara TVA': sellingPriceWithoutVat.toFixed(4),
      'Pret vanzare cu TVA': sellingPriceWithVat.toFixed(4),
      'Lot': '',
      'Data expirarii (dd-mm-yyyy)': '',
      'Cota TVA intrare': (vatRate * 100).toFixed(0) + '%',
      'Cota TVA iesire': isVatPayer ? (vatRate * 100).toFixed(0) + '%' : 'Neplatitor de TVA',
    };

    markupPercentage = originalMarkupPercentage;

    csvRows.push(row);
  });

  return csvRows;
}

export async function mapXmlDataToFacturisDesktopNomenclatorCsv(
  jsonData: JsonData,
  markupPercentage: number
): Promise<CsvRow[]> {
  const invoiceLines = jsonData.Invoice.InvoiceLine;
  const csvRows: CsvRow[] = [];
  const isVatPayer = store.get('isVatPayer', false);
  const originalMarkupPercentage = markupPercentage;

  const lines = Array.isArray(invoiceLines) ? invoiceLines : [invoiceLines];

  lines.forEach((line, index) => {
    const priceObj = line.Price;
    const itemObj = line.Item;
    const priceAmountObj = priceObj?.PriceAmount?.['#text'] || priceObj?.PriceAmount || 0;
    const itemName = itemObj?.Name || 'Unknown Product';
    const classifiedTaxCategory = itemObj?.ClassifiedTaxCategory;
    const taxPercent = classifiedTaxCategory?.Percent
      ? parseFloat(classifiedTaxCategory.Percent) / 100
      : 0;

    let basePrice = priceAmountObj ? parseFloat(priceAmountObj) : 0;
    let vatRate = taxPercent;

    let priceWithoutVat = basePrice;
    let priceWithVat = parseFloat((basePrice * (1 + vatRate)).toFixed(4));
    let sellingPriceWithoutVat;
    let sellingPriceWithVat;

    const markupMultiplier = 1 + markupPercentage / 100;

    if (isVatPayer) {
      sellingPriceWithoutVat = parseFloat((priceWithoutVat * markupMultiplier).toFixed(3));
      sellingPriceWithVat = parseFloat((sellingPriceWithoutVat * (1 + vatRate)).toFixed(4));
    } else {
      sellingPriceWithVat = parseFloat((priceWithVat * markupMultiplier).toFixed(4));
      sellingPriceWithoutVat = sellingPriceWithVat;
    }

    const productCode = itemObj?.StandardItemIdentification?.ID?.['#text'] || '';

    let row: CsvRow = {
      'Nr. crt.': index + 1,
      'Nume Produs': itemName,
      'UM': 'BUC',
      'Pret fara TVA': sellingPriceWithoutVat.toFixed(2),
      'Pret cu TVA': sellingPriceWithVat.toFixed(2),
      'Moneda': priceObj?.['@_currencyID'] || 'RON',
      'Cod EAN': '',
      'Cod Produs': productCode,
      'Observatii 1': '',
      'Observatii 2': '',
      'Tip': 'Produs',
      'Pret 2 fara TVA': '',
      'Pret 2 cu TVA': '',
      'Pret 3 fara TVA': '',
      'Pret 3 cu TVA': '',
      'Cota TVA': (vatRate * 100).toFixed(0) + '%',
      'Categorie Produse': '',
      'Accize': '',
      'Greutate': '',
      'Observatii 3': '',
      'Observatii 4': ''
    };

    markupPercentage = originalMarkupPercentage;

    csvRows.push(row);
  });

  return csvRows;
}

