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

    // Prepare Products array
    const invoiceLines = invoice.InvoiceLine;
    const lines = Array.isArray(invoiceLines) ? invoiceLines : [invoiceLines];

    const Products = lines.map((line: any) => {
      const priceObj = line.Price;
      const priceAmountObj = priceObj?.PriceAmount;
      const basePrice = priceAmountObj ? parseFloat(priceAmountObj) : 0;

      const itemObj = line.Item;
      const itemName = itemObj?.Name || 'Unknown Product';
      const classifiedTaxCategory = itemObj?.ClassifiedTaxCategory;
      const vatRate = classifiedTaxCategory?.Percent
        ? parseFloat(classifiedTaxCategory.Percent)
        : 0;

      let measureUnit = line.InvoicedQuantity?.['@_unitCode'];
      measureUnit = measureUnit === 'H87' ? 'BUC' : measureUnit === 'KGM' ? 'Kg' : measureUnit || 'BUC';

      const standardItemIdentification = itemObj?.StandardItemIdentification;
      const productCode = standardItemIdentification?.ID || '';

      const quantity = line.InvoicedQuantity ? parseFloat(line.InvoicedQuantity) : 0;

      return {
        'Denumire produs': itemName,
        'Cod produs': productCode,
        'U.M.': measureUnit,
        'Cantitate': quantity.toString(),
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
