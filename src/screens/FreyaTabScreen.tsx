import { useEffect, useState } from 'react';
import Toast from '../components/Toast';
import GhidRapid from '../components/GhidRapid';
import MainContent from '../components/MainContent';

const FreyaTabScreen = () => {
  const [isVatPayer, setIsVatPayer] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Initialize VAT Payer Status
  useEffect(() => {
    const initialize = async () => {
      try {
        const vatPayerStatus = await window.api.getVatPayerStatus();
        setIsVatPayer(vatPayerStatus);
      } catch (error) {
        console.error('Failed to get VAT payer status:', error);
      }
    };
    initialize();
  }, []);

  // Set up event listeners for file processing
  useEffect(() => {
    const handleFileProcessed = (message: any) => {
      setShowToast(true);
      setToastMessage(message);
    };

    const handleError = (error: any) => {
      setShowToast(true);
      setToastMessage(error);
    };

    window.api.receiveMessage('freya-xml-saved', handleFileProcessed);
    window.api.receiveMessage('file-processing-error', handleError);

    return () => {
      window.api.removeListener('freya-xml-saved', handleFileProcessed);
      window.api.removeListener('file-processing-error', handleError);
    };
  }, []);

  // Toggle VAT Payer Status
  const handleToggleVatPayerStatus = async () => {
    const newStatus = !isVatPayer;
    try {
      await window.api.setVatPayerStatus(newStatus);
      setIsVatPayer(newStatus);
      setToastMessage(newStatus ? 'Plătitor de TVA' : 'Neplătitor de TVA');
      setShowToast(true);
    } catch (error) {
      console.error('Failed to set VAT payer status:', error);
      setToastMessage('Eroare la setarea statusului de TVA.');
      setShowToast(true);
    }
  };

  // Open File Dialog for Freya
  const openDialogForFreya = async () => {
    try {
      await window.api.setFacturisType('freya');
      console.log('Facturis type set successfully, opening file dialog...');
      window.api.openFileDialog();
    } catch (error) {
      console.error('Error setting Facturis type:', error);
      setToastMessage('Eroare la setarea tipului Facturis.');
      setShowToast(true);
    }
  };

  const freyaSteps = [
    { icon: '💼', text: 'Pune un status plătitor sau neplătitor TVA' },
    { icon: '📤', text: 'Încarcă fișierul XML pentru procesare.' },
  ];

  return (
    <div className="flex flex-col bg-gray-100 h-full mt-4 container-factura">
      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
      <div className="flex flex-grow overflow-hidden bg-black">
        <GhidRapid steps={freyaSteps} />
        <MainContent
          title="Creează NIR Freya"
          isVatPayer={isVatPayer}
          handleToggleVatPayerStatus={handleToggleVatPayerStatus}
          openDialog={openDialogForFreya}
        />
      </div>
    </div>
  );
};

export default FreyaTabScreen;