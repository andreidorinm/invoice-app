import xml2js from 'xml2js';

async function parseXml(data: any) {
  return new Promise((resolve, reject) => {
    xml2js.parseString(data, { explicitArray: false, mergeAttrs: true }, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

export default parseXml;
