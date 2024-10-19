import xml2js from 'xml2js';

async function parseXml(data: any): Promise<any> {
  return new Promise((resolve, reject) => {
    xml2js.parseString(
      data,
      {
        explicitArray: false,
        mergeAttrs: true,
        tagNameProcessors: [xml2js.processors.stripPrefix],
        attrNameProcessors: [xml2js.processors.stripPrefix],
        explicitCharkey: false,
        xmlns: true,
        charkey: '_',
      },
      (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      }
    );
  });
}

export default parseXml;
