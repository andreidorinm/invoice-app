import { IpcMainEvent, IpcMainInvokeEvent, ipcMain, dialog } from "electron";
import { IPC_ACTIONS } from "./IPCActions";
import electronStore from 'electron-store';
import { processForFacturisOnline } from "../controllers/onlineController";
import { processForFacturisDesktop } from "../controllers/desktopController";
const { v4: uuidv4 } = require('uuid');

const {
    SET_LICENSE_KEY,
    GET_LICENSE_KEY,
    SET_MARKUP_PERCENTAGE,
    GET_MARKUP_PERCENTAGE,
    GET_VAT_PAYER_STATUS,
    SET_VAT_PAYER_STATUS,
    SELECT_SAVE_PATH,
    OPEN_FILE_DIALOG,
    SET_FACTURIS_TYPE,
    GET_FACTURIS_TYPE,
    GET_DEVICE_ID
} = IPC_ACTIONS.Window;

const handleSetLicenseKey = (_event: IpcMainEvent, key: string) => {
    try {
        const store = new electronStore();
        store.set("licenseKey", key);

    } catch (e: any) {
        console.log(e.message)
    }
}

const handleGetLicenseKey = (_event: IpcMainInvokeEvent, _key: string): string | undefined => {
    try {
        const store = new electronStore();
        return store.get('licenseKey') as string;
    } catch (e: any) {
        console.log(e.message)
    }
    return ''
}

const handleSetFacturisType = (_event: IpcMainEvent, facturisType: string) => {
    const store = new electronStore();
    store.set("facturisType", facturisType);
};

const handleGetFacturisType = (_event: IpcMainInvokeEvent) => {
    try {
        const store = new electronStore();
        return store.get('facturisType') as string;
    } catch (e: any) {
        console.log(e.message)
    }
    return ''
};

const handleOpenFileDialog = (_event: IpcMainEvent) => {
    dialog.showOpenDialog({
        properties: ['openFile', 'multiSelections'],
        filters: [{ name: 'XML Files', extensions: ['xml'] }]
    }).then(result => {
        if (!result.canceled && result.filePaths.length > 0) {
            const store = new electronStore();
            const facturisType = store.get("facturisType", "desktop");

            result.filePaths.forEach(filePath => {
                if (facturisType === "online") {
                    processForFacturisOnline(filePath, (err: any, message: any) => {
                        if (err) {
                            console.error('Error processing file:', err);
                            _event.reply('file-processing-error', err.message);
                            return;
                        }
                        console.log(message);
                        _event.reply('csv-written', message);
                    });
                } else {
                    processForFacturisDesktop(filePath, (err: any, message: any) => {
                        if (err) {
                            console.error('Error processing file:', err);
                            _event.reply('file-processing-error', err.message);
                            return;
                        }
                        console.log(message);
                        _event.reply('csv-written', message);
                    });
                }
            });
        }
    }).catch(err => {
        console.error(err);
    });
};


const handleSetMarkupPercentage = (_event: IpcMainEvent, markupPercentage: any) => {
    const store = new electronStore();
    console.log("Setting markup percentage in store:", markupPercentage);
    const percentageValue = typeof markupPercentage === 'string' ? parseFloat(markupPercentage) : markupPercentage;
    store.set("markupPercentage", percentageValue);
};

const handleGetMarkupPercentage = (_event: IpcMainInvokeEvent, _markupPercentage: any): string | unknown => {
    const store = new electronStore();
    const markupPercentage = store.get("markupPercentage", 0);
    return markupPercentage;
}

const handleSetVatPayerStatus = (_event: IpcMainEvent, isVatPayer: any) => {
    const store = new electronStore();
    store.set("isVatPayer", isVatPayer);
};

const handleGetVatPayerStatus = (_event: IpcMainInvokeEvent, _isVatPayer: any): string | unknown => {
    const store = new electronStore();
    const isVatPayer = store.get("isVatPayer", false);
    return isVatPayer;
}

const handleSelectSavePath = async (_event: IpcMainInvokeEvent): Promise<string | undefined> => {
    try {
        const { filePaths } = await dialog.showOpenDialog({
            properties: ['openDirectory', 'createDirectory', 'promptToCreate'],
            title: 'Select a folder to save your files'
        });

        if (filePaths && filePaths.length > 0) {
            return filePaths[0];
        }
    } catch (e: any) {
        console.error('Error selecting save path:', e.message);
    }
};

const handleGetDeviceId = (_event: IpcMainInvokeEvent): string => {
    const store = new electronStore();
    let deviceId = store.get('deviceId') as string | undefined;
    if (!deviceId) {
        deviceId = uuidv4();
        store.set('deviceId', deviceId);
    }
    return deviceId as string;
}

export const registerIPCHandlers = () => {
    ipcMain.on(SET_LICENSE_KEY, handleSetLicenseKey);
    ipcMain.handle(GET_LICENSE_KEY, (event, key) => handleGetLicenseKey(event, key));

    ipcMain.on(SET_MARKUP_PERCENTAGE, handleSetMarkupPercentage);
    ipcMain.handle(GET_MARKUP_PERCENTAGE, (event, markupPercentage) => handleGetMarkupPercentage(event, markupPercentage));

    ipcMain.on(SET_VAT_PAYER_STATUS, handleSetVatPayerStatus);
    ipcMain.handle(GET_VAT_PAYER_STATUS, (event, isVatPayer) => handleGetVatPayerStatus(event, isVatPayer));

    ipcMain.on(OPEN_FILE_DIALOG, handleOpenFileDialog);
    ipcMain.handle(SELECT_SAVE_PATH, handleSelectSavePath);

    ipcMain.on(SET_FACTURIS_TYPE, handleSetFacturisType);
    ipcMain.handle(GET_FACTURIS_TYPE, handleGetFacturisType);

    ipcMain.handle(GET_DEVICE_ID, handleGetDeviceId);
}
