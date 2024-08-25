import { parseStringPromise } from 'xml2js';
import store from '../config/electronStore';

export async function mapXmlToSmartBillNir(xmlData: any) {
  try {
    const result = await parseStringPromise(xmlData);
    const invoice = result.Invoice;
    const markupPercentage: any = store.get('markupPercentage', 0);
    const isVatPayer = store.get('isVatPayer', false);

    if (!invoice || !invoice['cac:InvoiceLine']) {
      throw new Error("Invalid XML structure: Invoice details are missing.");
    }

    // Fix potential issue with namespace handling
    const invoiceLines = invoice['cac:InvoiceLine'] || [];

    return {
      SmartBill: {
        Products: invoiceLines.map((line: any) => {
          const item = line['cac:Item'][0];
          const priceDetails = line['cac:Price'][0];
          const quantityDetails = line['cbc:InvoicedQuantity'][0];
          const taxCategory = item['cac:ClassifiedTaxCategory'][0];

          if (!item || !priceDetails || !quantityDetails || !taxCategory) {
            console.warn("Missing essential data, skipping line.");
            return null;
          }

          const basePrice = parseFloat(priceDetails['cbc:PriceAmount'][0]['_']) ?? 0;
          const vatRate = parseFloat(taxCategory['cbc:Percent'][0]) ?? 0;
          let sellingPriceWithoutVat = basePrice * (1 + markupPercentage / 100);
          const sellingPriceWithVat = sellingPriceWithoutVat * (1 + vatRate / 100);

          return {
            'Denumire produs': item['cbc:Name'][0],
            'Cod produs': item['cac:SellersItemIdentification']?.['cbc:ID'][0] || 'N/A',
            'Pret': isVatPayer ? sellingPriceWithVat.toFixed(2) : sellingPriceWithoutVat.toFixed(2),
            'Pretul contine TVA': isVatPayer ? 'Da' : 'Nu',
            'Unitate masura': quantityDetails['$'].unitCode || 'N/A',
            'Moneda': 'RON',
            'Cota TVA': vatRate.toFixed(0),
            'Tip': 'produs'
          };
        }).filter((product: any) => product !== null) // Filter out null entries
      }
    };
  } catch (error) {
    console.error("Error processing XML for Smart Bill NIR:", error);
    throw error;
  }
}
