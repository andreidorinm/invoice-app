import { parseStringPromise } from 'xml2js';
import store from '../config/electronStore';

export async function mapXmlToOblioXml(xmlData: any) {
  try {
    const result = await parseStringPromise(xmlData);
    const invoice = result.Invoice;
    const isVatPayer = store.get('isVatPayer', false);

    if (!invoice || !invoice['cac:InvoiceLine']) {
      throw new Error("Invalid XML structure: Invoice details are missing.");
    }

    const documentDate = invoice['cbc:IssueDate'][0];
    const supplierName = invoice['cac:AccountingSupplierParty'][0]['cac:Party'][0]['cac:PartyName'][0]['cbc:Name'][0];

    return {
      documentDate,
      supplierName,
      Oblio: {
        Products: invoice['cac:InvoiceLine'].map((line: any) => {
          const basePrice =
            line['cac:Price'] && line['cac:Price'][0]['cbc:PriceAmount']
              ? parseFloat(line['cac:Price'][0]['cbc:PriceAmount'][0]['_'])
              : 0;
          const vatRate =
            line['cac:Item'] && line['cac:Item'][0]['cac:ClassifiedTaxCategory']
              ? parseFloat(line['cac:Item'][0]['cac:ClassifiedTaxCategory'][0]['cbc:Percent'][0])
              : 0;
          const priceWithoutVat = basePrice;

          let measureUnit = line['cbc:InvoicedQuantity'][0]['$']['unitCode'];
          measureUnit =
            measureUnit === 'H87' ? 'BUC' : measureUnit === 'KGM' ? 'Kg' : measureUnit;

          const productCode =
            line['cac:Item'] &&
            line['cac:Item'][0]['cac:StandardItemIdentification'] &&
            line['cac:Item'][0]['cac:StandardItemIdentification'][0]['cbc:ID'][0]['_']
              ? line['cac:Item'][0]['cac:StandardItemIdentification'][0]['cbc:ID'][0]['_']
              : line['cac:Item'][0]['cac:StandardItemIdentification'][0]['cbc:ID'][0];

          return {
            'Denumire produs': line['cac:Item']
              ? line['cac:Item'][0]['cbc:Name'][0]
              : 'Unknown Product',
            'Cod produs': productCode,
            'U.M.': measureUnit,
            'Cantitate': line['cbc:InvoicedQuantity']
              ? line['cbc:InvoicedQuantity'][0]['_']
              : 0,
            'Pret achizitie': priceWithoutVat.toFixed(2),
            'Cota TVA': vatRate.toFixed(0),
            'TVA inclus': isVatPayer ? 'DA' : 'NU'
          };
        })
      }
    };
  } catch (error) {
    console.error("Error processing XML:", error);
    throw error;
  }
}
