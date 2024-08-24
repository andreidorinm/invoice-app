import fs from 'fs';
import path from 'path';
import { dialog } from 'electron';
import { mapXmlToNirFreyaXml } from '../mappers/freyaMappers';

async function processXmlForFreyaNir(filePath: any, callback: any) {
  try {
    const xmlData = fs.readFileSync(filePath, 'utf8');
    const nirXml = await mapXmlToNirFreyaXml(xmlData);

    const { filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory', 'promptToCreate'],
      title: 'Select a folder to save your NIR files',
    });

    if (!filePaths || filePaths.length === 0) {
      throw new Error('No directory selected');
    }

    const outputDir = path.join(filePaths[0], `NIR_${new Date().toISOString()}.xml`);
    fs.writeFileSync(outputDir, nirXml);
    callback(null, `NIR XML saved successfully at ${outputDir}`);
  } catch (error) {
    console.error('Error processing XML for Freya NIR:', error);
    callback(error);
  }
}

export { processXmlForFreyaNir };
