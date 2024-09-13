import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { getDeviceId, getLicenseKey, setLicenseKey } from "../data/IPCMessages";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Loader from "../components/Loader";

const LicenseKeyContext = createContext<LicenseKeyProviderValue | null>(null);

export function useLicenseKey() {
    const context = useContext(LicenseKeyContext);
    if (!context) {
      throw new Error('useLicenseKey must be used within a LicenseKeyProvider');
    }
    return context;
  }

export interface LicenseKeyProviderProps {
    children: React.ReactNode;
}

interface apiMessage {
    success: boolean;
    error: boolean;
    errorMessage: string;
    expiryDate?: string;
}

type CheckOrActivateLicenseKeyFn = (licenseKey?: string) => Promise<apiMessage>;

interface LicenseKeyProviderValue {
    checkOrActivateLicenseKey: CheckOrActivateLicenseKeyFn;
    expiryDate?: string;
}

const LicenseKeyProvider = ({ children }: LicenseKeyProviderProps) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState<boolean>(true);
    const [expiryDate, setExpiryDate] = useState<string | undefined>();
    const hasCheckedOnLoad = useRef(false);

    const checkOrActivateLicenseKey: CheckOrActivateLicenseKeyFn = useCallback(async (licenseKey?: string) => {
        const keyToUse = licenseKey || await getLicenseKey();

        if (!keyToUse) {
            setLoading(false);
            return { error: true, success: false, errorMessage: 'No license key provided.' };
        }

        try {
            const deviceId = await getDeviceId();

            const response = await axios.post(import.meta.env.VITE_LICENSE_VALIDATION_URL, {
                licenseKey: keyToUse,
                deviceId: deviceId
            },
            {
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            });

            console.log("Making request to:", import.meta.env.VITE_LICENSE_VALIDATION_URL, "with key:", keyToUse);
            const data = response.data;
            setLoading(false);

            if (!data.success) {
                return { error: true, success: false, errorMessage: data.message || 'License operation failed.' };
            }

            setLicenseKey(keyToUse); setExpiryDate(data.expiryDate);
            return { 
                error: false, 
                success: true, 
                errorMessage: '',
                expiryDate: data.expiryDate,
            };
        } catch (error) {
            setLoading(false);
            if (axios.isAxiosError(error) && error.response) {
                return { error: true, success: false, errorMessage: error.response.data.message || 'An error occurred during the request.' };
            }
            console.log("Axios request failed with error:", error);
            return { error: true, success: false, errorMessage: 'An unknown error occurred.' };
        }
    }, []);

    useEffect(() => {
        if (!hasCheckedOnLoad.current) {
          checkOrActivateLicenseKey().then(response => {
            if (response.error) {
              navigate('/');
            } else {
              navigate('/app');
            }
          });
          hasCheckedOnLoad.current = true;
        }
      }, [checkOrActivateLicenseKey, navigate]);

    useEffect(() => {
        const intervalId = setInterval(() => {
          checkOrActivateLicenseKey();
        }, 24 * 60 * 60 * 1000);
      
        return () => clearInterval(intervalId);
      }, [checkOrActivateLicenseKey]); 

    const contextValue = { checkOrActivateLicenseKey, expiryDate };

    return (
        <LicenseKeyContext.Provider value={contextValue}>
            {loading ? <Loader /> : children}
        </LicenseKeyContext.Provider>
    );
};

export default LicenseKeyProvider;
