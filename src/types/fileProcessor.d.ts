export interface JsonData {
  Invoice: {
    [key: string]: any; // Adjust according to your XML structure for more precise typing
  };
}

export interface CsvRow {
  [key: string]: string | number;
}
