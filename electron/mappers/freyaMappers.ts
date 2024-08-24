import { parseStringPromise } from 'xml2js';
import store from '../config/electronStore';

export async function mapXmlToNirFreyaXml(xmlData: any) {
  const result = await parseStringPromise(xmlData);
  const invoice = result.Invoice;
  const markupPercentage: any = store.get('markupPercentage', 0);
  const isVatPayer = store.get('isVatPayer', false);

  // This now returns a JavaScript object
  return {
    NIR: {
      DocumentSeries: invoice['cbc:ID'][0],
      DocumentNo: invoice['cbc:ID'][0],
      DocumentDate: invoice['cbc:IssueDate'][0],
      DeadlineDate: invoice['cbc:IssueDate'][0],
      Supplier: invoice['cac:AccountingSupplierParty'][0]['cac:Party'][0]['cac:PartyName'][0]['cbc:Name'][0],
      FinancialAdministration: "Gestiune materii prime",
      Products: invoice['cac:InvoiceLine'].map((line: any) => {
        const basePrice = parseFloat(line['cac:Price'][0]['cbc:PriceAmount'][0]['_']);
        const vatRate = parseFloat(line['cac:Item'][0]['cac:ClassifiedTaxCategory'][0]['cbc:Percent'][0]) / 100;
        const priceWithoutVat = parseFloat(basePrice.toFixed(2));
        const priceWithVat = basePrice * (1 + vatRate);

        let sellingPriceWithoutVat, sellingPriceWithVat, outputVatRate;
        if (isVatPayer) {
          sellingPriceWithoutVat = priceWithoutVat * (1 + markupPercentage / 100);
          sellingPriceWithVat = sellingPriceWithoutVat * (1 + vatRate);
          outputVatRate = (vatRate * 100).toFixed(0) + '%';
        } else {
          sellingPriceWithVat = priceWithVat * (1 + markupPercentage / 100);
          sellingPriceWithoutVat = sellingPriceWithVat;
          outputVatRate = 'Neplatitor de TVA';
        }

        return {
          ProductName: line['cac:Item'][0]['cbc:Name'][0],
          ProductCode: '',
          Units: line['cbc:InvoicedQuantity'][0]['_'],
          UnitPriceWithoutVat: sellingPriceWithoutVat.toFixed(2),
          Discount: '0.00',
          VatRate: outputVatRate,
          MeasureUnit: line['cbc:InvoicedQuantity'][0]['$']['unitCode']
        };
      })
    }
  };
}

