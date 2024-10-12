import { useEffect, useState } from 'react';
import Toast from '../components/Toast';
import { useLicenseKey } from '../providers/LicenseKeyProvider';
import Loader from '../components/Loader';
import ExpiryBanner from '../components/ExpiryBanner';
import Header from '../components/Header';
import OblioTabScreen from './OblioTabScreen';
import FacturisTabScreen from './FacturisTabScreen';
import FreyaTabScreen from './FreyaTabScreen';
import SmartbillTabScreen from './SmarbillTabScreen';

const FileProcessorScreen = () => {
  const [markup, setMarkup] = useState('');
  const [isVatPayer, setIsVatPayer] = useState(false);
  const [facturisType, setFacturisType] = useState('facturis desktop');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [activeTab, setActiveTab] = useState('facturis');
  const { expiryDate } = useLicenseKey();
  const [exeOutput, setExeOutput] = useState('');
  const [exeError, setExeError] = useState('');
  const [loadingExe, setLoadingExe] = useState(false); // Loader state

  const handleRunExe = () => {
    setLoadingExe(true); // Show loader
    window.api.runExe()
      .then((code: any) => {
        console.log(`Exe finished with exit code ${code}`);
      })
      .catch((error: any) => {
        console.error('Error running exe:', error);
      })
      .finally(() => {
        setLoadingExe(false); // Hide loader when done
      });
  };

  useEffect(() => {
    window.api.receiveMessage('exe-output', (data: any) => {
      setExeOutput(data);
    });

    window.api.receiveMessage('exe-error', (error: any) => {
      setExeError(error);
    });
  }, []);

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
      const loadedFacturisType = await window.api.getFacturisType();

      setFacturisType(loadedFacturisType);
      setIsVatPayer(vatPayerStatus);
      setMarkup(storedMarkup.toString());

      switch (loadedFacturisType) {
        case 'freya':
          setActiveTab('freya');
          break;
        case 'oblio':
          setActiveTab('oblio');
          break;
        case 'smartbill':
          setActiveTab('smartbill');
          break;
        default:
          setActiveTab('facturis');
          break;
      }
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
    <div className="flex flex-col bg-gray-100 h-screen w-screen">
      {loadingExe && <Loader />}

      {expiryDate && (
        <ExpiryBanner expiryDate={expiryDate} calculateTimeLeft={calculateTimeLeft} />
      )}

      <Toast message={toastMessage} isVisible={showToast} onClose={closeToast} />

      <Header activeTab={activeTab} handleTabClick={handleTabClick}>
        {/* Exe Button in the Header */}
        <button
          onClick={handleRunExe}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition duration-150"
        >
          Încarcă factura în format PDF
        </button>
      </Header>

      <div className="flex flex-grow">
        {activeTab === 'facturis' && (
          <FacturisTabScreen
            facturisType={facturisType}
            handleFacturisTypeChange={handleFacturisTypeChange}
            isVatPayer={isVatPayer}
            handleToggleVatPayerStatus={handleToggleVatPayerStatus}
            markup={markup}
            handleMarkupChange={handleMarkupChange}
            handleBlurMarkup={handleBlurMarkup}
            increaseMarkup={increaseMarkup}
            decreaseMarkup={decreaseMarkup}
            openDialog={openDialog}
            loading={loadingExe}
          />
        )}
        {activeTab === 'freya' && <FreyaTabScreen />}
        {activeTab === 'oblio' && <OblioTabScreen />}
        {activeTab === 'smartbill' && <SmartbillTabScreen />}
      </div>

      {/* Display exe output or error at the bottom */}
      {(exeOutput || exeError) && (
        <div className="p-4 bg-gray-200">
          {exeOutput && <div>Output: {exeOutput}</div>}
          {exeError && <div>Error: {exeError}</div>}
        </div>
      )}
    </div>
  );

};

export default FileProcessorScreen;
