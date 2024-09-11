import moment from 'moment';
import xml2js from 'xml2js';
import { parseStringPromise } from 'xml2js';

export async function mapXmlToNirFreyaXml(xmlData: any) {
  const options = {
    explicitArray: false,
    ignoreAttrs: false,
    tagNameProcessors: [xml2js.processors.stripPrefix]
  };

  const result = await parseStringPromise(xmlData, options);
  const invoice = result.Invoice;

  const documentDate = invoice.IssueDate ? moment(invoice.IssueDate).format('M/D/YYYY') : 'N/A';
  const currentTime = moment().format('HH:mm');
  const formattedDocumentDate = `${documentDate} ${currentTime}`;

  const products = (Array.isArray(invoice.InvoiceLine) ? invoice.InvoiceLine : [invoice.InvoiceLine]).map((line: any) => {
    const priceAmount = parseFloat(line.Price.PriceAmount._);
    const units = parseFloat(line.InvoicedQuantity._);
    const vatRate = parseFloat(line.Item.ClassifiedTaxCategory.Percent) / 100;

    let measureUnit = line.InvoicedQuantity.$.unitCode;
    measureUnit = measureUnit === 'H87' ? 'buc' : (measureUnit === 'KGM' ? 'kilogram' : measureUnit);
    
    return {
      ProductName: line.Item.Name,
      ProductCode: '',
      Units: units,
      UnitPriceWithoutVat: priceAmount.toFixed(2),
      Discount: '0',
      VatRate: vatRate,
      MeasureUnit: measureUnit
    };
  });

  return {
    NIR: {
      DocumentSeries: invoice.ID,
      DocumentNo: invoice.ID,
      DocumentDate: formattedDocumentDate,
      DeadlineDate: formattedDocumentDate,
      Supplier: invoice.AccountingSupplierParty.Party.PartyName.Name,
      FinancialAdministration: "Gestiune materii prime",
      Products: products
    }
  };
}
