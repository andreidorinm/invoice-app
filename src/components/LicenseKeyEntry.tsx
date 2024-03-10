import { useRef, useState } from 'react'
import '../App.css'
import { useNavigate } from 'react-router-dom';
import { useLicenseKey } from '../providers/LicenseKeyProvider';
import ExcelIcon from '../assets/excel.ico'

function LicenseKeyEntry() {
  const [errorMessage, setErrorMessage] = useState('');
  const errorMessageLabel = useRef<HTMLLabelElement>(null);
  const licenseKeyRef = useRef<HTMLInputElement>(null);

  const licenseKey = useLicenseKey();
  const navigate = useNavigate();


  const handleActivateLicenseKey = async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.preventDefault();

    if (licenseKeyRef.current) {
      let licenseKeyValue = licenseKeyRef.current.value;

      licenseKeyValue = licenseKeyValue.replace(/\s/g, '');

      if (licenseKeyValue === '') {
        setErrorMessage('Licenta este gresita');
        return;
      }

      try {
        const response = await licenseKey.handleActivateLicenseKey(licenseKeyValue);

        if (response.error) {
          setErrorMessage(response.errorMessage);
          return;
        } else {
          navigate('/app');
        }
      } catch (error: any) {
        setErrorMessage(error.message);
      }
    }
  }

  return (
    <div className="relative flex flex-col justify-center overflow-hidden">
      <div className="w-full p-6 m-auto bg-white rounded-md shadow-md lg:max-w-lg rounded-lg">
        <div className='flex justify-center'>
          <img src={ExcelIcon} width={45} alt="ExcelIcon" />
        </div>
        <h1 className="text-3xl font-semibold text-center text-dark text-gray-600">ClarFactura in NIR aici iti vei activa licenta</h1>
        <form className="space-y-4">
          <div>
            <label className="label">
              <span className="text-base label-text">Te rugam sa introduci licenta</span>
            </label>
            <input ref={licenseKeyRef} type="text" placeholder="Cheia de licenta" className="w-full input input-bordered input-primary" />
          </div>
          {errorMessage !== '' && (
            <>
              <span ref={errorMessageLabel} className="text-xs label-text text-error display-none">{errorMessage}</span>
              <br />
            </>
          )}
          <div className="flex flex-row gap-8 justify-center">
            <div>
              <button className="btn btn-primary" onClick={handleActivateLicenseKey}>Activeaza licenta</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}


export default LicenseKeyEntry
