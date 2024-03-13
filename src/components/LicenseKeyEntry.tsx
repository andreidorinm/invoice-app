import { useRef, useState, useEffect } from 'react';
import '../App.css';
import { useNavigate } from 'react-router-dom';
import { useLicenseKey } from '../providers/LicenseKeyProvider';
import ExcelIcon from '../assets/excel.ico';

function LicenseKeyEntry() {
  const [errorMessage, setErrorMessage] = useState('');
  const [licenseParts, setLicenseParts] = useState(["", "", "", "", ""]);
  const segmentLengths = [8, 4, 4, 4, 12];
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const licenseKey = useLicenseKey();

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleInputChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const newLicenseParts = [...licenseParts];
    newLicenseParts[index] = event.target.value.toUpperCase().slice(0, segmentLengths[index]);
    setLicenseParts(newLicenseParts);

    if (event.target.value.length === segmentLengths[index] && index < licenseParts.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLFormElement>) => {
    event.preventDefault();
  
    const pasteData = event.clipboardData.getData('text').toUpperCase().replace(/\s/g, '').split('-');
  
    if (pasteData.length === licenseParts.length) {
      const adjustedPasteData = pasteData.map((part, index) => part.slice(0, segmentLengths[index]));
      setLicenseParts(adjustedPasteData);
  
      const lastPartIndex = pasteData.length - 1;
      if (pasteData[lastPartIndex].length === segmentLengths[lastPartIndex] && inputRefs.current[lastPartIndex + 1]) {
        inputRefs.current[lastPartIndex + 1]?.focus();
      } else {
        inputRefs.current[lastPartIndex]?.focus();
      }
    } else {
      const combinedData = pasteData.join('').slice(0, segmentLengths.reduce((acc, length) => acc + length, 0));
      let position = 0;
      const newLicenseParts = segmentLengths.map(length => {
        const part = combinedData.slice(position, position + length);
        position += length;
        return part;
      });
  
      setLicenseParts(newLicenseParts);
  
      const nextEmptyIndex = newLicenseParts.findIndex(part => part.length < 8);
      if (nextEmptyIndex !== -1) {
        inputRefs.current[nextEmptyIndex]?.focus();
      } else {
        inputRefs.current[newLicenseParts.length - 1]?.focus();
      }
    }
  };
  
  
  

  const handleActivateLicenseKey = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const licenseKeyValue = licenseParts.join('-');

    if (licenseKeyValue.replace(/-/g, '').length !== 32) {
        setErrorMessage('Licența este greșită');
        return;
    }

    if (!licenseKey) { // Check if licenseKey is not null
        console.error("licenseKey is null"); // Handle this scenario appropriately
        return;
    }

    try {
        const response = await licenseKey.checkOrActivateLicenseKey(licenseKeyValue);
        if (response.error) {
            setErrorMessage(response.errorMessage);
            return;
        } else {
            navigate('/app');
        }
    } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
    }
};


  const getInputSizeClass = (maxLength: any) => {
    switch (maxLength) {
      case 8: return "w-32";
      case 4: return "w-20";
      case 12: return "w-40";
      default: return "w-1/4";
    }
  };

  return (
    <div className="relative flex flex-col justify-center overflow-hidden">
      <div className="w-full p-6 m-auto bg-white rounded-md shadow-md">
        <div className='flex justify-center'>
          <img src={ExcelIcon} width={45} alt="ExcelIcon" />
        </div>
        <h1 className="text-3xl font-semibold text-center text-gray-600">ClarFactura in NIR.</h1>
        <form className="space-y-4" onPaste={handlePaste}>
          <div>
            <label className="label">
              <span className="text-base label-text">Te rugam sa introduci licenta</span>
            </label>
            <div className="flex justify-between gap-2">
              {licenseParts.map((part, index) => (
                <input
                  key={index}
                  ref={(el) => inputRefs.current[index] = el}
                  type="text"
                  maxLength={segmentLengths[index]}
                  value={part}
                  onChange={(e) => handleInputChange(index, e)}
                  className={`input input-bordered input-primary ${getInputSizeClass(segmentLengths[index])}`}
                  placeholder={`${'X'.repeat(segmentLengths[index])}`}
                />
              ))}
            </div>
          </div>
          {errorMessage !== '' && (
            <div>
              <span className="text-xs text-error">{errorMessage}</span>
              <br />
            </div>
          )}
          <div className="flex justify-center">
            <button className="btn btn-primary" onClick={handleActivateLicenseKey}>Activeaza licenta</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LicenseKeyEntry;
