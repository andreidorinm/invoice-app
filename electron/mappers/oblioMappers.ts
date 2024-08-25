import { parseStringPromise } from 'xml2js';
import store from '../config/electronStore';

export async function mapXmlToOblioXml(xmlData: any) {
  try {
    const result = await parseStringPromise(xmlData);
    const invoice = result.Invoice;
    const markupPercentage: any = store.get('markupPercentage', 0);
    const isVatPayer = store.get('isVatPayer', false);

    if (!invoice || !invoice['cac:InvoiceLine']) {
      throw new Error("Invalid XML structure: Invoice details are missing.");
    }

    return {
      Oblio: {
        Products: invoice['cac:InvoiceLine'].map((line: any) => {
          const basePrice = line['cac:Price'] && line['cac:Price'][0]['cbc:PriceAmount'] ? parseFloat(line['cac:Price'][0]['cbc:PriceAmount'][0]['_']) : 0;
          const vatRate = line['cac:Item'] && line['cac:Item'][0]['cac:ClassifiedTaxCategory'] ? parseFloat(line['cac:Item'][0]['cac:ClassifiedTaxCategory'][0]['cbc:Percent'][0]) : 0;
          const priceWithoutVat = basePrice;
          const priceWithVat = basePrice * (1 + vatRate / 100);

          let sellingPriceWithoutVat = priceWithoutVat * (1 + markupPercentage / 100);
          let sellingPriceWithVat = sellingPriceWithoutVat * (1 + vatRate / 100);

          return {
            'Denumire produs': line['cac:Item'] ? line['cac:Item'][0]['cbc:Name'][0] : 'Unknown Product',
            'Cod produs': line['cac:Item'] && line['cac:Item'][0]['cac:SellersItemIdentification'] ? line['cac:Item'][0]['cac:SellersItemIdentification'][0]['cbc:ID'][0] : 'Fara cod',
            'U.M.': line['cbc:InvoicedQuantity'] ? line['cbc:InvoicedQuantity'][0]['$']['unitCode'] : 'N/A',
            'Cantitate': line['cbc:InvoicedQuantity'] ? line['cbc:InvoicedQuantity'][0]['_'] : 0,
            'Pret achizitie': priceWithoutVat.toFixed(2),
            'Cota TVA': vatRate.toFixed(0) + '%',
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