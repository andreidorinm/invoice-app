// transformCsv.js
const xml2js = require('xml2js');
const { format } = require('fast-csv');
const fs = require('fs');
const path = require('path');

// Function to format date from 'yyyy-mm-dd' to 'dd-mm-yyyy'
function formatDate(ymdDate) {
  const [year, month, day] = ymdDate.split('-');
  return `${day}-${month}-${year}`;
}

// Function to map XML data to CSV columns with hardcoded column names
function mapXmlDataToCsv(jsonData) {
  const invoiceLines = jsonData.Invoice['cac:InvoiceLine'];
  const csvRows = [];

  // Iterate over each line item
  (Array.isArray(invoiceLines) ? invoiceLines : [invoiceLines]).forEach((line, index) => {
    let row = {
      'Nr. crt.': index + 1,
      'Nume Produs': line['cac:Item']['cbc:Name'],
      'UM': 'BUC', // Assuming the Unit of Measure is always 'BUC'
      'Cod Produs EAN': '', // If you have this information, extract it from the XML
      'Cantitate': line['cbc:InvoicedQuantity']['_'],
      // Continue mapping the rest of the columns as per the XML structure
      'Pret achizitie fara TVA': '', // Add logic to calculate or extract this value
      'Pret achizitie cu TVA': '', // Add logic to calculate or extract this value
      'Pret vanzare fara TVA': '', // Add logic to calculate or extract this value
      'Pret vanzare cu TVA': '', // Add logic to calculate or extract this value
      'Lot': '', // Extract if available
      'Data expirarii (dd-mm-yyyy)': '', // Extract or format if available
      'Cota TVA intrare': '', // Extract if available
      'Cota TVA iesire': '' // Extract if available
      // Ensure all columns are accounted for
    };
    csvRows.push(row);
  });

  return csvRows;
}

// Function to parse XML, transform it to CSV format, and write to a file
function parseAndTransform(filePath, outputDir, callback) {
  fs.readFile(filePath, (err, data) => {
    if (err) return callback(err);

    xml2js.parseString(data, { explicitArray: false, mergeAttrs: true }, (err, result) => {
      if (err) return callback(err);

      const issueDate = formatDate(result.Invoice['cbc:IssueDate']);
      const outputFileName = `NIR_${issueDate}.csv`;
      const outputPath = path.join(outputDir, outputFileName);

      // Ensure the output directory exists
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const csvData = mapXmlDataToCsv(result);
      const csvStream = format({ headers: true });
      const writableStream = fs.createWriteStream(outputPath);

      writableStream.on('finish', () => callback(null, `CSV file has been written: ${outputFileName}`));
      writableStream.on('error', err => callback(err));

      csvStream.pipe(writableStream);
      csvData.forEach(row => csvStream.write(row));
      csvStream.end();
    });
  });
}

module.exports = { parseAndTransform };
