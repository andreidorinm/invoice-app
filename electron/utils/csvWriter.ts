import { format } from 'fast-csv';
import fs from 'fs';

async function writeCsvData(outputPath: any, csvData: any, callback: any) {
  const csvStream = format({ headers: true });
  const writableStream = fs.createWriteStream(outputPath);

  writableStream.on('finish', () => {
    console.log(`File saved at: ${outputPath}`);
    callback(null, `File saved at: ${outputPath}`);
  });

  writableStream.on('error', err => {
    console.error('Error saving file:', err);
    callback(err);
  });

  csvStream.pipe(writableStream);
  csvData.forEach((row: any) => csvStream.write(row));
  csvStream.end();
}

export default writeCsvData;
