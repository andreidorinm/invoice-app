import React, { useEffect, useState } from 'react';
import Toast from './Toast';
import ToggleSwitch from './ToggleSwitch';
import { useLicenseKey } from '../providers/LicenseKeyProvider';

const FreyaTab = () => {
  const [markup, setMarkup] = useState('');
  const [isVatPayer, setIsVatPayer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const { expiryDate } = useLicenseKey();

  useEffect(() => {
    const initialize = async () => {
      const storedMarkup = await window.api.getMarkupPercentage();
      const vatPayerStatus = await window.api.getVatPayerStatus();
      setIsVatPayer(vatPayerStatus);
      setMarkup(storedMarkup.toString());
      setLoading(false);
    };
    initialize();
  }, []);

  const handleMarkupChange = (e: any) => {
    const value = e.target.value;
    const formattedValue = value.replace(/^0+/, '') || '0';
    setMarkup(formattedValue);
  };

  const handleBlurMarkup = async () => {
    if (markup.trim() === '') {
      setMarkup('0');
    }
    try {
      await window.api.setMarkupPercentage(Number(markup));
      setShowToast(true);
      setToastMessage(`Markup percentage set to: ${markup}%`);
    } catch (error) {
      console.error("Failed to set markup percentage:", error);
      setShowToast(true);
      setToastMessage("Error setting markup percentage.");
    }
  };

  const handleToggleVatPayerStatus = async () => {
    const newStatus = !isVatPayer;
    try {
      await window.api.setVatPayerStatus(newStatus);
      setIsVatPayer(newStatus);
      setShowToast(true);
      setToastMessage(newStatus ? 'VAT Payer' : 'Non-VAT Payer');
    } catch (error) {
      console.error("Failed to set VAT payer status:", error);
    }
  };

  const openDialog = () => {
    window.api.openFileDialog();
  };

  return (
    <div className="container">
      {showToast && <Toast message={toastMessage} onClose={() => setShowToast(false)} />}
      <div className="settings">
        <ToggleSwitch isOn={isVatPayer} handleToggle={handleToggleVatPayerStatus} label="VAT Payer Status" />
        <div>
          <label>Markup Percentage</label>
          <input type="text" value={markup} onChange={handleMarkupChange} onBlur={handleBlurMarkup} disabled={loading} />
        </div>
        <button onClick={openDialog}>Open File Dialog for Freya</button>
      </div>
    </div>
  );
};

export default FreyaTab;
