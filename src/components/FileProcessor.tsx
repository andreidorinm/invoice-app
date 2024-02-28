import { useEffect, useState } from 'react';

const FileProcessor = () => {
  const [jsonDataDisplay, setJsonDataDisplay] = useState('');
  const [markup, setMarkup] = useState(0);
  const [isVatPayer, setIsVatPayer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [facturisType, setFacturisType] = useState('Desktop');


  useEffect(() => {
    const initialize = async () => {
      const storedMarkup = await window.api.getMarkupPercentage();
      const vatPayerStatus = await window.api.getVatPayerStatus();
      const facturisType = await window.api.getFacturisType();
      setFacturisType(facturisType);
      setIsVatPayer(vatPayerStatus);
      setMarkup(storedMarkup);
      setLoading(false);
    };

    const onFileProcessed = (data: any) => {
      const parsedData = JSON.parse(data);
      displayData(parsedData);
    };

    const onDisplayJson = (data: any) => {
      setJsonDataDisplay(data);
    };

    window.api.receive('file-processed', onFileProcessed);
    window.api.receive('display-json', onDisplayJson);

    initialize();

    return () => {
      window.api.removeListener('file-processed', onFileProcessed);
      window.api.removeListener('display-json', onDisplayJson);
    };
  }, []);

  const handleSetMarkup = async () => {
    try {
      await window.api.setMarkupPercentage(markup);
      console.log("Markup percentage set successfully.");
    } catch (error) {
      console.error("Failed to set markup percentage:", error);
    }
  };

  const openDialog = () => {
    window.api.openFileDialog();
  };

  const displayData = (data: any) => {
    setJsonDataDisplay(JSON.stringify(data, null, 2));
  };

  const handleSetVatPayerStatus = async () => {
    try {
      const newStatus = !isVatPayer;
      await window.api.setVatPayerStatus(newStatus);
      setIsVatPayer(newStatus);
      console.log(`VAT payer status set to: ${newStatus}`);
    } catch (error) {
      console.error("Failed to set VAT payer status:", error);
    }
  };

  const handleFacturisTypeChange = async (newType: 'desktop' | 'online') => {
    setFacturisType(newType);
    try {
      await window.api.setFacturisType(newType);
      console.log(`Facturis type set to: ${newType}`);
    } catch (error) {
      console.error("Failed to set Facturis type:", error);
    }
  };


  return (
    <div className="container mx-auto p-6 bg-white shadow-md">
      <h2 className="text-xl font-bold mb-4">File Processor Settings</h2>
      <div className="mb-5">
        <label className="text-gray-700">Facturis Type:</label>
        <div className="mt-2">
          <button
            className={`px-4 py-2 rounded-l-md ${facturisType === 'desktop' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => handleFacturisTypeChange('desktop')}
          >
            Desktop
          </button>
          <button
            className={`px-4 py-2 rounded-r-md ${facturisType === 'online' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => handleFacturisTypeChange('online')}
          >
            Online
          </button>
        </div>
      </div>
      <div className="flex items-center mb-5">
        <label htmlFor="vatPayer" className="inline-flex items-center cursor-pointer">
          <span className="ml-2 text-gray-700">Platitor de TVA</span>
          <input
            id="vatPayer"
            type="checkbox"
            className="form-checkbox h-5 w-5 text-gray-600"
            checked={isVatPayer}
            onChange={handleSetVatPayerStatus}
          />
        </label>
      </div>

      <div className="flex flex-col mb-5">
        <label htmlFor="markup" className="mb-2 text-gray-700">Adaos comercial</label>
        <input
          id="markup"
          type="number"
          className="form-input block w-full px-3 py-2 border border-gray-300 rounded-md"
          value={markup}
          onChange={(e) => setMarkup(Number(e.target.value))}
          placeholder="Adaos comercial"
          disabled={loading}
        />
      </div>

      <div className="flex flex-col mb-5">
        <button
          onClick={handleSetMarkup}
          className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none"
        >
          Seteaza adaos comercial
        </button>
      </div>

      <div>
        <button
          id="select-files"
          onClick={openDialog}
          className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none"
        >
          Selecteaza XML ANAF
        </button>
        <div id="json-display" className="mt-4 p-4 bg-gray-100 rounded-md">
          <pre className="text-sm">{jsonDataDisplay}</pre>
        </div>
      </div>
    </div>
  );
};

export default FileProcessor;
