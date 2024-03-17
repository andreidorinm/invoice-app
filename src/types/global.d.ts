export {};

declare global {
  interface Window {
    api: {
      receiveMessage(arg0: string, handleFileProcessed: (message: any) => void): unknown;
      openFileDialog: () => void;
      setLicenseKey: (key: string) => void;
      getLicenseKey: () => Promise<string>;
      receive: (channel: string, func: (...args: any[]) => void) => void;
      send: (channel: string, ...args: any[]) => void;
      removeListener: (channel: string, func: (...args: any[]) => void) => void;
      getMarkupPercentage: () => Promise<number>;
      setMarkupPercentage: (percentage: number) => Promise<void>;
      setVatPayerStatus: (isVatPayer: boolean) => Promise<void>;
      getVatPayerStatus: () => Promise<boolean>;
      selectSavePath: () => Promise<string>;
      setFacturisType: (type: string) => void;
      getFacturisType: () => Promise<string>;
      getDeviceId: () => Promise<string>;
    };
  }
}
