import { XMLParser } from 'fast-xml-parser';
import store from '../config/electronStore';

export async function mapXmlToOblioXml(xmlData: string) {
  try {
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
    const result = parser.parse(xmlData);

    const invoice = result.Invoice;
    const isVatPayer = store.get('isVatPayer', false);

    if (!invoice || !invoice.InvoiceLine) {
      throw new Error("Invalid XML structure: Invoice details are missing.");
    }

    const documentDate = invoice.IssueDate;
    const supplierParty = invoice.AccountingSupplierParty;
    const party = supplierParty.Party;

    if (!party) {
      throw new Error('Unable to find Party information in the XML');
    }

    const supplierName = party.PartyName?.Name || party.PartyLegalEntity?.RegistrationName;

    if (!supplierName) {
      throw new Error('Unable to find supplier name in the XML');
    }

    const invoiceLines = invoice.InvoiceLine;
    const lines = Array.isArray(invoiceLines) ? invoiceLines : [invoiceLines];

    const Products = lines.map((line: any) => {
      const priceObj = line.Price;
      const priceAmountObj = priceObj?.PriceAmount?.['#text'] || priceObj?.PriceAmount || '0';
      let basePrice = parseFloat(priceAmountObj);

      const itemObj = line.Item;
      const itemName = itemObj?.Name || 'Unknown Product';
      const classifiedTaxCategory = itemObj?.ClassifiedTaxCategory;
      let vatRate = classifiedTaxCategory?.Percent ? parseFloat(classifiedTaxCategory.Percent) : 0;

      let measureUnit = line.InvoicedQuantity?.['@_unitCode'];
      measureUnit = measureUnit === 'H87' ? 'BUC' : measureUnit === 'KGM' ? 'Kg' : measureUnit || 'BUC';

      const standardItemIdentification = itemObj?.StandardItemIdentification?.ID;

      const productCode = standardItemIdentification?.['#text'] || standardItemIdentification || '';

      if (productCode === '') {
        console.error('Missing or malformed product code:', standardItemIdentification);
      }

      let quantity = line.InvoicedQuantity?.['#text'] ? parseFloat(line.InvoicedQuantity['#text']) : parseFloat(line.InvoicedQuantity) || 0;

      if (itemName.toUpperCase().includes('GARANTIE SGR')) {
        if (basePrice === 0.50) {
          vatRate = 0;
          basePrice = 0.50;
        } else {
          const multiplierMatch = itemName.match(/(\d+)X0\.5LEI/i);
          if (multiplierMatch) {
            const multiplier = parseInt(multiplierMatch[1], 10);
            const originalQuantity = quantity;

            quantity = multiplier * originalQuantity;

            const totalValueWithoutVat = basePrice * originalQuantity;

            basePrice = parseFloat((totalValueWithoutVat / quantity).toFixed(4));

            vatRate = 0;
          }
        }
      }

      return {
        'Denumire produs': itemName,
        'Cod produs': productCode,
        'U.M.': measureUnit,
        'Cantitate': quantity.toFixed(2),
        'Pret achizitie': basePrice.toFixed(2),
        'Cota TVA': vatRate.toFixed(0),
        'TVA Inclus': isVatPayer ? 'DA' : 'NU',
      };
    });

    return {
      documentDate,
      supplierName,
      Oblio: {
        Products,
      },
    };
  } catch (error) {
    console.error("Error processing XML:", error);
    throw error;
  }
}
