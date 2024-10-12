import { parseStringPromise } from 'xml2js';

export async function mapXmlToSmartBillNir(xmlData: any) {
  try {
    const result = await parseStringPromise(xmlData);
    const invoice = result.Invoice;

    if (!invoice || !invoice['cac:InvoiceLine']) {
      throw new Error("Invalid XML structure: Invoice details are missing.");
    }

    const documentDate = invoice['cbc:IssueDate'][0];
    const supplierName =
      invoice['cac:AccountingSupplierParty'][0]['cac:Party'][0]['cac:PartyName'][0]['cbc:Name'][0];

    return {
      documentDate,
      supplierName,
      SmartBill: {
        Products: invoice['cac:InvoiceLine']
          .map((line: any) => {
            const basePrice =
              line['cac:Price'] && line['cac:Price'][0]['cbc:PriceAmount']
                ? parseFloat(line['cac:Price'][0]['cbc:PriceAmount'][0]['_'])
                : 0;
            const priceWithoutVat = basePrice;

            let measureUnit = line['cbc:InvoicedQuantity'][0]['$']['unitCode'];
            measureUnit =
              measureUnit === 'H87' ? 'BUC' : measureUnit === 'KGM' ? 'Kg' : measureUnit;

            const taxExemptionReason = 'Standard';

            const productCode =
              line['cac:Item'] &&
              line['cac:Item'][0]['cac:StandardItemIdentification'] &&
              line['cac:Item'][0]['cac:StandardItemIdentification'][0]['cbc:ID'][0]['_']
                ? line['cac:Item'][0]['cac:StandardItemIdentification'][0]['cbc:ID'][0]['_']
                : line['cac:Item'][0]['cac:StandardItemIdentification'][0]['cbc:ID'][0];

            return {
              'Cod': productCode,
              'Articol': line['cac:Item']
                ? line['cac:Item'][0]['cbc:Name'][0]
                : 'Unknown Product',
              'Categorie': taxExemptionReason,
              'Tip': 'produs',
              'Cant.': line['cbc:InvoicedQuantity']
                ? line['cbc:InvoicedQuantity'][0]['_']
                : 0,
              'Pret': priceWithoutVat.toFixed(2),
              'Um': measureUnit,
            };
          })
          .filter((product: any) => product !== null),
      },
    };
  } catch (error) {
    console.error("Error processing XML for Smart Bill NIR:", error);
    throw error;
  }
}
