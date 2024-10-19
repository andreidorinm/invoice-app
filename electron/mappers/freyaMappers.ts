import moment from 'moment';
import xml2js from 'xml2js';
import { parseStringPromise } from 'xml2js';

export async function mapXmlToNirFreyaXml(xmlData: any) {
  const options = {
    explicitArray: false,
    ignoreAttrs: false,
    tagNameProcessors: [],
    attrNameProcessors: [],
    valueProcessors: [xml2js.processors.parseNumbers, xml2js.processors.parseBooleans],
  };

  const result = await parseStringPromise(xmlData, options);
  const invoice = result.Invoice;

  const documentDate = invoice.IssueDate ? moment(invoice.IssueDate).format('M/D/YYYY') : 'N/A';
  const currentTime = moment().format('HH:mm');
  const formattedDocumentDate = `${documentDate} ${currentTime}`;

  const invoiceLines = Array.isArray(invoice.InvoiceLine) ? invoice.InvoiceLine : [invoice.InvoiceLine];

  const products = invoiceLines.map((line: any) => {
    const priceAmount = parseFloat(line.Price.PriceAmount._ || line.Price.PriceAmount);
    const units = parseFloat(line.InvoicedQuantity._ || line.InvoicedQuantity);
    const vatRate = parseFloat(line.Item.ClassifiedTaxCategory.Percent) / 100;

    let measureUnit = line.InvoicedQuantity.$.unitCode;
    measureUnit = measureUnit === 'H87' ? 'buc' : measureUnit === 'KGM' ? 'kilogram' : measureUnit;

    const productCode =
      line.Item.StandardItemIdentification?.ID?._ ||
      line.Item.StandardItemIdentification?.ID ||
      '';

    return {
      ProductName: line.Item.Name,
      ProductCode: productCode,
      Units: units,
      UnitPriceWithoutVat: priceAmount.toFixed(2),
      Discount: '0',
      VatRate: vatRate,
      MeasureUnit: measureUnit,
    };
  });

  const supplierName =
    invoice?.AccountingSupplierParty?.Party?.PartyName?.Name ||
    invoice?.AccountingSupplierParty?.Party?.PartyLegalEntity?.RegistrationName ||
    'Unknown Supplier';

  return {
    NIR: {
      DocumentSeries: invoice.ID,
      DocumentNo: invoice.ID,
      DocumentDate: formattedDocumentDate,
      DeadlineDate: formattedDocumentDate,
      Supplier: supplierName,
      FinancialAdministration: 'Gestiune materii prime',
      Products: products,
    },
  };
}
