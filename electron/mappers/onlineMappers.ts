import { CsvRow, JsonData } from '../../src/types/fileProcessor';
import store from '../config/electronStore';

function calculatePrices(priceWithoutVat: number, vatRate: number, markupMultiplier: number, isVatPayer: boolean) {
  let sellingPriceWithoutVat = priceWithoutVat * markupMultiplier;
  let sellingPriceWithVat = sellingPriceWithoutVat * (1 + vatRate);

  if (!isVatPayer) {
    sellingPriceWithVat = priceWithoutVat * markupMultiplier;
    sellingPriceWithoutVat = sellingPriceWithVat;
  }

  return { sellingPriceWithoutVat, sellingPriceWithVat };
}

export async function mapXmlDataToFacturisOnlineNirCsv(
  jsonData: JsonData,
  markupPercentage: number
): Promise<CsvRow[]> {
  const invoiceLines = jsonData.Invoice.InvoiceLine;
  const csvRows: CsvRow[] = [];
  const isVatPayer = store.get('isVatPayer', false) as boolean;
  const originalMarkupPercentage = markupPercentage;

  const lines = Array.isArray(invoiceLines) ? invoiceLines : [invoiceLines];

  lines.forEach((line, index) => {
    const priceObj = line.Price;
    const priceAmountObj = priceObj?.PriceAmount?.['#text'] || priceObj?.PriceAmount || '0';
    const basePrice = parseFloat(priceAmountObj);

    const itemObj = line.Item;
    const itemName = itemObj?.Name || 'Unknown Product';
    const classifiedTaxCategory = itemObj?.ClassifiedTaxCategory;
    const vatRate = classifiedTaxCategory?.Percent ? parseFloat(classifiedTaxCategory.Percent) / 100 : 0;

    let priceWithoutVat = basePrice || 0;
    let quantity = line.InvoicedQuantity ? parseFloat(line.InvoicedQuantity?.['#text'] || line.InvoicedQuantity) : 0;

    const standardItemIdentification = itemObj?.StandardItemIdentification;
    const productCode = standardItemIdentification?.ID?.['#text'] || standardItemIdentification?.ID || 'N/A';

    if (itemName.toUpperCase().includes('GARANTIE SGR')) {
      if (priceWithoutVat === 0.50) {
        markupPercentage = 0;
        priceWithoutVat = 0.50;
      } else {
        const multiplierMatch = itemName.match(/(\d+)X0\.5LEI/i);
        if (multiplierMatch) {
          const multiplier = parseInt(multiplierMatch[1], 10);
          quantity *= multiplier;
          priceWithoutVat = basePrice / quantity;
        }
      }
    }

    const markupMultiplier = 1 + markupPercentage / 100;
    const { sellingPriceWithoutVat, sellingPriceWithVat } = calculatePrices(priceWithoutVat, vatRate, markupMultiplier, isVatPayer);

    const row: CsvRow = {
      'Nr. Crt.': index + 1,
      'Cod Produs': productCode,
      'Denumire Produs': itemName,
      'UM': 'BUC',
      'Cant.': quantity.toFixed(2),
      'Pret fara TVA. Achizitie': priceWithoutVat.toFixed(3),
      'Pret cu TVA. Achizitie': (priceWithoutVat * (1 + vatRate)).toFixed(3),
      'TVA Achizitie': `${(vatRate * 100).toFixed(0)}%`,
      'Pret fara TVA. Vanzare': sellingPriceWithoutVat.toFixed(2),
      'Pret cu TVA. Vanzare': sellingPriceWithVat.toFixed(2),
      'TVA Vanzare': isVatPayer ? `${(vatRate * 100).toFixed(0)}%` : 'Neplatitor de TVA',
      'Moneda Achizitie': priceObj?.['@_currencyID'] || 'RON',
      'Moneda Vanzare': 'RON',
      'Lot Produs': '',
      'Data Expirare': '',
    };

    markupPercentage = originalMarkupPercentage;
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
  const isVatPayer = store.get('isVatPayer', false) as boolean;
  const originalMarkupPercentage = markupPercentage;

  const lines = Array.isArray(invoiceLines) ? invoiceLines : [invoiceLines];

  lines.forEach((line, index) => {
    const priceObj = line.Price;
    const priceAmountObj = priceObj?.PriceAmount?.['#text'] || priceObj?.PriceAmount || '0';
    const basePrice = parseFloat(priceAmountObj);

    const itemObj = line.Item;
    const itemName = itemObj?.Name || 'Unknown Product';
    const classifiedTaxCategory = itemObj?.ClassifiedTaxCategory;
    const vatRate = classifiedTaxCategory?.Percent ? parseFloat(classifiedTaxCategory.Percent) / 100 : 0;

    let priceWithoutVat = basePrice || 0;
    let quantity = line.InvoicedQuantity ? parseFloat(line.InvoicedQuantity?.['#text'] || line.InvoicedQuantity) : 0;

    const standardItemIdentification = itemObj?.StandardItemIdentification;
    const productCode = standardItemIdentification?.ID?.['#text'] || standardItemIdentification?.ID || 'N/A';

    if (itemName.toUpperCase().includes('GARANTIE SGR')) {
      if (priceWithoutVat === 0.50) {
        markupPercentage = 0;
        priceWithoutVat = 0.50;
      } else {
        const multiplierMatch = itemName.match(/(\d+)X0\.5LEI/i);
        if (multiplierMatch) {
          const multiplier = parseInt(multiplierMatch[1], 10);
          quantity *= multiplier;
          priceWithoutVat = basePrice / quantity;
        }
      }
    }

    const markupMultiplier = 1 + markupPercentage / 100;
    const { sellingPriceWithoutVat, sellingPriceWithVat } = calculatePrices(priceWithoutVat, vatRate, markupMultiplier, isVatPayer);

    const row: CsvRow = {
      'Ctr.': index + 1,
      'Produs': itemName,
      'UM': 'BUC',
      'Pret fara TVA': sellingPriceWithoutVat.toFixed(2),
      'Pret cu TVA': sellingPriceWithVat.toFixed(2),
      'Moneda': priceObj?.['@_currencyID'] || 'RON',
      'Cota TVA': isVatPayer ? `${(vatRate * 100).toFixed(0)}%` : 'Neplatitor de TVA',
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

    markupPercentage = originalMarkupPercentage;
    csvRows.push(row);
  });

  return csvRows;
}
