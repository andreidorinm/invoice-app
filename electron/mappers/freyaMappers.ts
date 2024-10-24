import moment from 'moment';
import { XMLParser } from 'fast-xml-parser';

export async function mapXmlToNirFreyaXml(xmlData: string) {
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

  const documentDate = invoice.IssueDate ? moment(invoice.IssueDate).format('M/D/YYYY') : '';
  const currentTime = moment().format('HH:mm');
  const formattedDocumentDate = `${documentDate} ${currentTime}`;

  const invoiceLines = Array.isArray(invoice.InvoiceLine) ? invoice.InvoiceLine : [invoice.InvoiceLine];

  const products = invoiceLines.map((line: any) => {
    const priceAmount = parseFloat(line.Price?.PriceAmount?.['#text'] || line.Price?.PriceAmount || 0);
    const units = parseFloat(line.InvoicedQuantity?.['#text'] || line.InvoicedQuantity || 0);
    const vatRate = parseFloat(line.Item?.ClassifiedTaxCategory?.Percent || 0) / 100;

    let measureUnit = line.InvoicedQuantity?.['@_unitCode'] || 'buc';
    measureUnit = measureUnit === 'H87' ? 'buc' : measureUnit === 'KGM' ? 'kilogram' : measureUnit;

    const productCode =
      line.Item?.StandardItemIdentification?.ID?.['#text'] ||
      line.Item?.StandardItemIdentification?.ID ||
      '';

    return {
      ProductName: line.Item?.Name || 'Unknown Product',
      ProductCode: productCode || '',
      Units: units.toFixed(2),
      UnitPriceWithoutVat: priceAmount.toFixed(2),
      Discount: '0',
      VatRate: vatRate.toFixed(2),
      MeasureUnit: measureUnit,
    };
  });

  // Extract supplier name
  const supplierName =
    invoice?.AccountingSupplierParty?.Party?.PartyName?.Name ||
    invoice?.AccountingSupplierParty?.Party?.PartyLegalEntity?.RegistrationName ||
    'Unknown Supplier';

  // Return the final NIR object
  return {
    NIR: {
      DocumentSeries: invoice?.ID || '',
      DocumentNo: invoice?.ID || '',
      DocumentDate: formattedDocumentDate,
      DeadlineDate: formattedDocumentDate,
      Supplier: supplierName,
      FinancialAdministration: 'Gestiune materii prime',
      Products: products,
    },
  };
}
