import { useEffect, useState } from 'react';
import Toast from './Toast';
import ToggleSwitch from './ToggleSwitch';
import ExcelIcon from '../assets/excel.ico'
import { useLicenseKey } from '../providers/LicenseKeyProvider';
import FreyaTab from './FreyaTab';
import OblioTab from './OblioTab';
import SmartbillTab from './SmarbillTab';

const FileProcessor = () => {
  const [markup, setMarkup] = useState('');
  const [isVatPayer, setIsVatPayer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [facturisType, setFacturisType] = useState('facturis desktop');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [activeTab, setActiveTab] = useState('facturis');
  const { expiryDate } = useLicenseKey();

  const calculateTimeLeft = () => {
    if (!expiryDate) {
      return 'Expiry date not available';
    }

    const currentDate = new Date();
    const expiry = new Date(expiryDate);
    const timeLeft = expiry.getTime() - currentDate.getTime(); // Time left in milliseconds

    const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    return daysLeft > 0 ? `${daysLeft} zile ramase pana la expirare` : 'Licenta a expirat';
  };


  useEffect(() => {
    if (expiryDate) {
      const timeLeftMessage = calculateTimeLeft();
      setShowToast(true);
      setToastMessage(timeLeftMessage);
    }
  }, [expiryDate]);

  useEffect(() => {
    const initialize = async () => {
      const storedMarkup = await window.api.getMarkupPercentage();
      const vatPayerStatus = await window.api.getVatPayerStatus();
      const facturisType = await window.api.getFacturisType();
      setFacturisType(facturisType);
      setIsVatPayer(vatPayerStatus);
      setMarkup(storedMarkup.toString());
      setLoading(false);
    };
    initialize();
  }, []);

  const handleBlurMarkup = async () => {
    if (markup.trim() === '') {
      setMarkup('0'); // Resetează la 0 dacă este gol
    }

    try {
      await window.api.setMarkupPercentage(Number(markup));
      setShowToast(true);
      setToastMessage(`Procentul de adaos comercial a fost setat la: ${markup}%`);
    } catch (error) {
      console.error("Nu am reusit să setăm procentul de adaos comercial:", error);
      setShowToast(true);
      setToastMessage("Eroare la setarea procentului de adaos comercial.");
    }
  };

  const handleToggleVatPayerStatus = async () => {
    const newStatus = !isVatPayer;
    try {
      await window.api.setVatPayerStatus(newStatus);
      setIsVatPayer(newStatus);
      setToastMessage(newStatus ? 'Plătitor de TVA' : 'Neplătitor de TVA');
      setShowToast(true);
    } catch (error) {
      console.error("Nu am reusit sa setam statusul platitor de TVA", error);
    }
  };

  const handleFacturisTypeChange = async (newType: any) => {
    setFacturisType(newType);
    try {
      await window.api.setFacturisType(newType);
      console.log(`Tipul de Facturis a fost setat: ${newType}`);
      setShowToast(true);
      setToastMessage(`Tipul de factura a fost setat: ${newType}`);
    } catch (error) {
      console.error("Nu am reusit sa setam tipul de Facturis:", error);
    }
  };

  const closeToast = () => {
    setShowToast(false);
  };

  const handleMarkupChange = (e: any) => {
    const value = e.target.value;
    const formattedValue = value.replace(/^0+/, '') || '0';
    setMarkup(formattedValue);
  };

  useEffect(() => {
    const handleFileProcessed = (message: any) => {
      console.log("File processed:", message);  // Debug log
      setShowToast(true);
      setToastMessage(message);
    };

    const handleError = (error: any) => {
    console.log("Processing error:", error);  // Debug log
      setShowToast(true);
      setToastMessage(error);
    };

    window.api.receiveMessage('csv-written', handleFileProcessed);
    window.api.receiveMessage('file-processing-error', handleError);

    return () => {
      window.api.removeListener('csv-written', handleFileProcessed);
      window.api.removeListener('file-processing-error', handleError);
    };
  }, []);

  const openDialog = () => {
    window.api.openFileDialog();
  };

  const increaseMarkup = async () => {
    setMarkup((prevMarkup) => {
      const newMarkup = parseFloat(prevMarkup) + 1;
      return newMarkup.toString();
    });

    await new Promise(resolve => setTimeout(resolve, 0));

    try {
      await window.api.setMarkupPercentage(Number(markup) + 1); // Asigură-te că actualizezi API-ul cu noua valoare
      setToastMessage(`Procentul de adaos comercial a fost setat la: ${Number(markup) + 1}%`);
      setShowToast(true);
    } catch (error) {
      console.error("Nu am reușit să setăm procentul de adaos comercial:", error);
      setToastMessage("Eroare la setarea procentului de adaos comercial.");
      setShowToast(true);
    }
  };

  const decreaseMarkup = async () => {
    setMarkup((prevMarkup) => {
      const newMarkup = Math.max(0, parseFloat(prevMarkup) - 1);
      return newMarkup.toString();
    });

    await new Promise(resolve => setTimeout(resolve, 0));

    try {
      await window.api.setMarkupPercentage(Math.max(0, Number(markup) - 1));
      setToastMessage(`Procentul de adaos comercial a fost setat la: ${Math.max(0, Number(markup) - 1)}%`);
      setShowToast(true);
    } catch (error) {
      console.error("Nu am reușit să setăm procentul de adaos comercial:", error);
      setToastMessage("Eroare la setarea procentului de adaos comercial.");
      setShowToast(true);
    }
  };

  const handleTabClick = (tabName: any) => {
    setActiveTab(tabName);
    if (tabName === 'freya') {
      handleFacturisTypeChange('freya');
    } else if (tabName === 'oblio') {
      handleFacturisTypeChange('oblio');
    } else if (tabName === 'smartbill') {
      handleFacturisTypeChange('smartbill');
    }
  };

  return (
    <div className="flex flex-col bg-gray-100 h-full mt-4 container-factura">
      {expiryDate && (
        <div className="fixed right-0 bottom-0 p-4 space-y-2">
          <span className="block text-right text-sm text-white bg-gray-800 p-2 rounded">Licenta expira pe data: {expiryDate}</span>
          <span className="block text-right text-sm text-white bg-gray-800 p-2 rounded">{calculateTimeLeft()}</span>
        </div>
      )}
      <Toast message={toastMessage} isVisible={showToast} onClose={closeToast} />
      <header className="p-4 bg-blue-600 text-white">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <img src={ExcelIcon} width={40} alt="Excel Icon" />
            <h1 className="text-3xl font-bold tracking-wide">ClarFactura in NIR</h1>
          </div>

          <div className="flex-1 flex flex-col items-center">
            <p className="text-sm font-medium">Te rog alege tipul de factura:</p>
            <div className="flex space-x-2 mt-2">
              <button
                className={`px-4 py-2 rounded transition-all duration-300 shadow-sm ${activeTab === 'facturis' ? 'bg-green-600 text-white' : 'bg-gray-200 text-black hover:bg-green-500 hover:text-white'}`}
                onClick={() => handleTabClick('facturis')}
              >
                Facturis
              </button>
              <button
                className={`px-4 py-2 rounded transition-all duration-300 shadow-sm ${activeTab === 'freya' ? 'bg-green-600 text-white' : 'bg-gray-200 text-black hover:bg-green-500 hover:text-white'}`}
                onClick={() => handleTabClick('freya')}
              >
                Freya
              </button>
              <button
                className={`px-4 py-2 rounded transition-all duration-300 shadow-sm ${activeTab === 'oblio' ? 'bg-green-600 text-white' : 'bg-gray-200 text-black hover:bg-green-500 hover:text-white'}`}
                onClick={() => handleTabClick('oblio')}
              >
                Oblio
              </button>
              <button
                className={`px-4 py-2 rounded transition-all duration-300 shadow-sm ${activeTab === 'smartbill' ? 'bg-green-600 text-white' : 'bg-gray-200 text-black hover:bg-green-500 hover:text-white'}`}
                onClick={() => handleTabClick('smartbill')}
              >
                Smartbill
              </button>
            </div>
          </div>
        </div>
      </header>
      <div className="flex flex-grow overflow-hidden bg-black">
        {activeTab === 'facturis' && (
          <>
            <main className="p-6 bg-white m-4 rounded-lg shadow-lg">
              <div className="mt-4 w-80">
                <h2 className="text-xl font-semibold text-black mb-4">📚 Ghid Rapid</h2>
                <ol className="list-decimal list-inside space-y-2 text-black">
                  <li className="flex items-center">🔧 Setează Tipul Facturis (Desktop sau Online).</li>
                  <li className="flex items-center">💼 Pune un status plătitor sau neplătitor TVA</li>
                  <li className="flex items-center">💹 Ajustează Procentajul de Adaos Comercial în câmpul dedicat și confirmă prin ieșirea din câmp.</li>
                  <li className="flex items-center">📤 Încarcă fișierul XML pentru procesare apăsând pe butonul dedicat.</li>
                </ol>
              </div>
            </main><main className="flex-grow p-6 bg-white m-4 rounded-lg shadow-lg">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-black">Tipul de Facturis</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleFacturisTypeChange('facturis desktop')}
                      className={`flex-1 button-facturis-type py-4 rounded-lg ${facturisType === 'facturis desktop' ? 'bg-blue-500 text-white' : 'bg-gray-200'} transition duration-150 ease-in-out`}
                    >
                      Desktop
                    </button>
                    <button
                      onClick={() => handleFacturisTypeChange('facturis online')}
                      className={`flex-1 button-facturis-type py-4 rounded-lg ${facturisType === 'facturis online' ? 'bg-blue-500 text-white' : 'bg-gray-200'} transition duration-150 ease-in-out`}
                    >
                      Online
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <ToggleSwitch isOn={isVatPayer} handleToggle={handleToggleVatPayerStatus} />
                  <span className={`ml-3 text-base font-medium ${isVatPayer ? 'text-green-700' : 'text-gray-600'}`}>
                    {isVatPayer ? 'Plătitor de TVA' : 'Neplătitor de TVA'}
                  </span>
                </div>
                <div>
                  <label htmlFor="markup" className="block mb-2 text-gray-700">Adaos Comercial</label>
                  <div className="flex justify-center items-center py-2">
                    <button
                      onClick={decreaseMarkup}
                      className="px-3 py-2 bg-gray-200 text-black rounded-l-lg hover:bg-blue-500 focus:outline-none transition duration-150 ease-in-out"
                    >
                      -
                    </button>
                    <input
                      id="markup"
                      type="text"
                      className="form-input text-center block w-32 py-2 mr-2 ml-2 border-t rounded border-b border-gray-300 transition duration-150 ease-in-out"
                      value={markup}
                      onChange={handleMarkupChange}
                      onBlur={handleBlurMarkup}
                      placeholder="0"
                      disabled={loading} />
                    <button
                      onClick={increaseMarkup}
                      className="px-3 py-2 bg-gray-200 text-black rounded-r-lg hover:bg-blue-500 focus:outline-none transition duration-150 ease-in-out"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="flex justify-center py-2">
                  <button
                    onClick={openDialog}
                    className="px-10 py-4 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:outline-none transition duration-150 ease-in-out"
                  >
                    Selectează fișierul XML ANAF
                  </button>
                </div>
              </div>
            </main></>
        )}
        {activeTab === 'freya' && <FreyaTab />}
        {activeTab === 'oblio' && <OblioTab />}
        {activeTab === 'smartbill' && <SmartbillTab />}
      </div>
    </div>
  );
};

export default FileProcessor;
