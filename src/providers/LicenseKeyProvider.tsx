import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getLicenseKey, setLicenseKey } from "../data/IPCMessages";
import { LemonAPIResponse, LemonAPIResponseValidateKey } from "../types/lemonSqueezy";
import { useNavigate } from "react-router-dom";
import LoadingScreen from "../screens/LoadingScreen";

const LicenseKeyContext = createContext({} as LicenseKeyProviderValue);

export function useLicenseKey() {
    return useContext<LicenseKeyProviderValue>(LicenseKeyContext);
}

export interface LicenseKeyProviderProps {
    children: string | JSX.Element | JSX.Element[] | React.ReactNode;
}

export interface apiMessage {
    success: boolean;
    error: boolean;
    errorMessage: string;
}

export interface LicenseKeyProviderValue {
    checkIfLicenseKeyIsActivated: () => Promise<apiMessage>,
    handleActivateLicenseKey: (licenseKey: string) => Promise<apiMessage>,
}

const LicenseKeyProvider = ({ children }: LicenseKeyProviderProps) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    const checkIfLicenseKeyIsActivated = useCallback(async (): Promise<apiMessage> => {
        const licenseKey = await getLicenseKey();

        if (!licenseKey) {
            return {
                error: true,
                success: false,
                errorMessage: 'No license key found.'
            };
        }


        const ret = await fetch(import.meta.env.VITE_LEMON_SQUEEZY_VALIDATE_URL,
            {
                method: 'POST',
                headers: {
                    'Accept': 'application/vnd.api+json',
                    'Content-Type': 'application/vnd.api+json'
                },
                body: JSON.stringify({ license_key: licenseKey })
            }
        ).then((response) => {
            return response.json();
        }).then((response: LemonAPIResponseValidateKey) => {

            if (response.error) {
                console.log(response.error);
                return {
                    error: true,
                    success: false,
                    errorMessage: response.error
                }
            }

            console.log(response);

            if (response.valid && response.license_key.status !== 'inactive') {
                setLicenseKey(response.license_key.key);
                return {
                    error: false,
                    success: true,
                    errorMessage: ''
                };
            } else {
                return {
                    error: true,
                    success: false,
                    errorMessage: 'License key is no longer valid or has been deactivated.'
                }
            }
        }).catch((error) => {
            return {
                error: true,
                success: false,
                errorMessage: error.message
            }
        })


        return ret ?? {
            error: false,
            success: true,
            errorMessage: ''
        };
    }, []);

    const handleActivateLicenseKey = async (licenseKey: string): Promise<apiMessage> => {
        if (licenseKey === '') {
            throw Error('Please enter a valid license key.')
        }

        const ret = await fetch(import.meta.env.VITE_LEMON_SQUEEZY_ACTIVATE_URL,
            {
                method: 'POST',
                headers: {
                    'Accept': 'application/vnd.api+json',
                    'Content-Type': 'application/vnd.api+json'
                },
                body: JSON.stringify({ license_key: licenseKey, instance_name: import.meta.env.VITE_LEMON_SQUEEZY_INSTANCE_NAME })
            }
        ).then((response) => {
            return response.json();
        }).then((response: LemonAPIResponse) => {
            if (response.error) {
                setLicenseKey('');
                return {
                    error: true,
                    success: false,
                    errorMessage: response.error
                }
            }

            console.log(response);

            setLicenseKey(response.license_key.key);

            if (response.activated) {
                return {
                    error: false,
                    success: true,
                    errorMessage: ''
                }
            }
        }).catch((error) => {
            return {
                error: true,
                success: false,
                errorMessage: error.message
            }
        })

        return ret ?? {
            error: false,
            success: true,
            errorMessage: ''
        }
    }

    useEffect(() => {
        const initializeLicenseKeyCheck = async () => {
            const response = await checkIfLicenseKeyIsActivated();
            if (response.error) {
                navigate('/');
            } else {
                navigate('/app');
            }
            setLoading(false);
        };

        initializeLicenseKeyCheck();
    }, [checkIfLicenseKeyIsActivated, navigate]);

    const value = {
        checkIfLicenseKeyIsActivated,
        handleActivateLicenseKey,
    }

    return (
        <LicenseKeyContext.Provider value={value}>
            {loading ? (
                <LoadingScreen />
            ) : (
                children
            )}
        </LicenseKeyContext.Provider>
    )
};

export default LicenseKeyProvider
