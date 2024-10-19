import { XMLParser } from 'fast-xml-parser';

export async function mapXmlToSmartBillNir(xmlData: string) {
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
      const priceAmountObj = priceObj?.PriceAmount;
      const basePrice = priceAmountObj ? parseFloat(priceAmountObj) : 0;

      const itemObj = line.Item;
      const itemName = itemObj?.Name || 'Unknown Product';

      let measureUnit = line.InvoicedQuantity?.['@_unitCode'];
      measureUnit = measureUnit === 'H87' ? 'BUC' : measureUnit === 'KGM' ? 'Kg' : measureUnit || 'BUC';

      const taxExemptionReason = 'Standard';

      const standardItemIdentification = itemObj?.StandardItemIdentification;
      const productCode = standardItemIdentification?.ID || '';

      const quantity = line.InvoicedQuantity ? parseFloat(line.InvoicedQuantity) : 0;

      return {
        'Cod': productCode,
        'Articol': itemName,
        'Categorie': taxExemptionReason,
        'Tip': 'produs',
        'Cant.': quantity.toString(),
        'Pret': basePrice.toFixed(2),
        'Um': measureUnit,
      };
    });

    return {
      documentDate,
      supplierName,
      SmartBill: {
        Products,
      },
    };
  } catch (error) {
    console.error('Error processing XML for Smart Bill NIR:', error);
    throw error;
  }
}
