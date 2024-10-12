import { IpcMainEvent, IpcMainInvokeEvent, ipcMain, dialog } from "electron";
import { IPC_ACTIONS } from "./IPCActions";
import electronStore from 'electron-store';
import { processForFacturisOnline } from "../controllers/onlineController";
import { processForFacturisDesktop } from "../controllers/desktopController";
import { processXmlForFreyaNir } from "../controllers/freyaController";
import { processXmlForOblio } from "../controllers/oblioController";
import { processXmlForSmartBill } from "../controllers/smartbillController";
import fs from 'fs';
import path from 'path';
import os from 'os';
import AdmZip from 'adm-zip'; 
const { v4: uuidv4 } = require('uuid');
const { spawn } = require('child_process');

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
    GET_DEVICE_ID,
    PROCESS_XML_FOR_FREYA,
    PROCESS_XML_FOR_OBLIO,
    PROCESS_XML_FOR_SMARTBILL,
    RUN_EXE
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

const handleProcessXmlForFreya = (_event: IpcMainEvent, filePath: string) => {
    processXmlForFreyaNir(filePath, (err: any, message: any) => {
        if (err) {
            console.error('Error processing XML for Freya NIR:', err);
            _event.reply('freya-processing-error', err.message);
            return;
        }
        console.log(message);
        _event.reply('freya-xml-saved', message);
    });
};

const handleProcessXmlForOblio = (_event: IpcMainEvent, filePath: string) => {
    processXmlForOblio(filePath, (err: any, message: any) => {
        if (err) {
            console.error('Error processing XML for Oblio NIR:', err);
            _event.reply('oblio-processing-error', err.message);
            return;
        }
        console.log(message);
        _event.reply('oblio-xml-saved', message);
    });
};

const handleProcessXmlForSmartbill = (_event: IpcMainEvent, filePath: string) => {
    processXmlForSmartBill(filePath, (err: any, message: any) => {
        if (err) {
            console.error('Error processing XML for Smartbill NIR:', err);
            _event.reply('smartbill-processing-error', err.message);
            return;
        }
        console.log(message);
        _event.reply('smartbill-xml-saved', message);
    });
};

const handleSetFacturisType = async (_event: IpcMainInvokeEvent, facturisType: string): Promise<boolean> => {
    const store = new electronStore();
    try {
        await store.set("facturisType", facturisType);
        console.log("Facturis type set to:", facturisType);
        return true;
    } catch (error) {
        console.error("Failed to set facturis type:", error);
        return false;
    }
};

ipcMain.handle(SET_FACTURIS_TYPE, handleSetFacturisType);


const handleGetFacturisType = (_event: IpcMainInvokeEvent) => {
    try {
        const store = new electronStore();
        return store.get('facturisType') as string;
    } catch (e: any) {
        console.log(e.message)
    }
    return ''
};

const handleOpenFileDialog = async (_event: IpcMainEvent) => {
    try {
        const result = await dialog.showOpenDialog({
            properties: ['openFile', 'multiSelections'],
            filters: [{ name: 'XML or ZIP Files', extensions: ['xml', 'zip'] }]
        });

        if (!result.canceled && result.filePaths.length > 0) {
            const store = new electronStore();
            const facturisType = store.get("facturisType", "facturis desktop");

            for (const filePath of result.filePaths) {
                const extension = path.extname(filePath).toLowerCase();
                if (extension === '.zip') {
                    console.log("Processing ZIP file:", filePath);

                    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'unzipped-'));
                    console.log("Extracting ZIP to temporary directory:", tempDir);

                    const zip = new AdmZip(filePath);
                    zip.extractAllTo(tempDir, true);

                    const xmlFiles: any[] = [];
                    const findXmlFiles = (dir: any) => {
                        const files = fs.readdirSync(dir);
                        for (const file of files) {
                            const fullPath = path.join(dir, file);
                            const stat = fs.statSync(fullPath);
                            if (stat.isDirectory()) {
                                findXmlFiles(fullPath);
                            } else if (path.extname(fullPath).toLowerCase() === '.xml') {
                                xmlFiles.push(fullPath);
                            }
                        }
                    };
                    findXmlFiles(tempDir);

                    console.log("Found XML files:", xmlFiles);

                    for (const xmlFilePath of xmlFiles) {
                        await processFile(xmlFilePath, facturisType, _event);
                    }

                    fs.rmSync(tempDir, { recursive: true, force: true });
                } else if (extension === '.xml') {
                    await processFile(filePath, facturisType, _event);
                } else {
                    console.log('Unsupported file type:', extension);
                    _event.reply('file-processing-error', 'Unsupported file type');
                }
            }
        }
    } catch (err: any) {
        console.error('Failed to open file dialog:', err);
        _event.reply('file-processing-error', err.message);
    }
};

async function processFile(filePath: any, facturisType: any, _event: any) {
    switch (facturisType) {
        case "facturis online":
            await processForFacturisOnline(filePath, (err: any, message: any) => {
                if (err) {
                    console.error('Error processing file:', err);
                    _event.reply('file-processing-error', err.message);
                    return;
                }
                console.log(message);
                _event.reply('csv-written', message);
            });
            break;
        case "facturis desktop":
            await processForFacturisDesktop(filePath, (err: any, message: any) => {
                if (err) {
                    console.error('Error processing file:', err);
                    _event.reply('file-processing-error', err.message);
                    return;
                }
                console.log(message);
                _event.reply('csv-written', message);
            });
            break;
        case "freya":
            try {
                console.log("Processing file for Freya NIR:", filePath);
                await processXmlForFreyaNir(filePath, (err, message) => {
                    if (err) {
                        console.error('Error processing XML for Freya NIR:', err);
                        _event.reply('freya-processing-error', err.message);
                        return;
                    }
                    console.log("Freya processing completed:", message);
                    _event.reply('freya-xml-saved', message);
                });
            } catch (error: any) {
                console.error('Caught error during Freya processing:', error);
                _event.reply('freya-processing-error', error.message);
            }
            break;
        case "oblio":
            try {
                console.log("Processing file for Oblio NIR:", filePath);
                await processXmlForOblio(filePath, (err, message) => {
                    if (err) {
                        console.error('Error processing XML for Oblio NIR:', err);
                        _event.reply('oblio-processing-error', err.message);
                        return;
                    }
                    console.log("Oblio processing completed:", message);
                    _event.reply('oblio-xml-saved', message);
                });
            } catch (error: any) {
                console.error('Caught error during Oblio processing:', error);
                _event.reply('oblio-processing-error', error.message);
            }
            break;
        case "smartbill":
            try {
                console.log("Processing file for Smartbill NIR:", filePath);
                await processXmlForSmartBill(filePath, (err: any, message: any) => {
                    if (err) {
                        console.error('Error processing XML for Smartbill NIR:', err);
                        _event.reply('smartbill-processing-error', err.message);
                        return;
                    }
                    console.log("Smartbill processing completed:", message);
                    _event.reply('smartbill-xml-saved', message);
                });
            } catch (error: any) {
                console.error('Caught error during Smartbill processing:', error);
                _event.reply('smartbill-processing-error', error.message);
            }
            break;
        default:
            console.log('Unsupported facturis type:', facturisType);
            _event.reply('file-processing-error', 'Unsupported facturis type');
            break;
    }
}

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

const handleRunExe = async (_event: IpcMainInvokeEvent) => {
    let exePath;

    if (process.env.NODE_ENV === 'development') {
        exePath = path.join(__dirname, '../src/assets/PROGRAM_FACTURI.exe');
    } else {
        exePath = path.join(process.resourcesPath, 'assets', 'PROGRAM_FACTURI.exe');
    }

    return new Promise((resolve, reject) => {
        const child = spawn(exePath);

        child.stdout.on('data', (data: any) => {
            console.log(`stdout: ${data}`);
            _event.sender.send('exe-output', data.toString()); // Send output via event sender
        });

        child.stderr.on('data', (data: any) => {
            console.error(`stderr: ${data}`);
            _event.sender.send('exe-error', data.toString()); // Send error via event sender
        });

        child.on('close', (code: number) => {
            console.log(`Child process exited with code ${code}`);
            resolve(code);  // Return the exit code via the promise
        });

        child.on('error', (err: Error) => {
            console.error('Failed to start process:', err);
            reject(err);  // Return the error via the promise
        });
    });
};

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

    ipcMain.on(PROCESS_XML_FOR_FREYA, handleProcessXmlForFreya);

    ipcMain.on(PROCESS_XML_FOR_OBLIO, handleProcessXmlForOblio);

    ipcMain.on(PROCESS_XML_FOR_SMARTBILL, handleProcessXmlForSmartbill);

    ipcMain.handle(RUN_EXE, handleRunExe);

    ipcMain.handle(GET_DEVICE_ID, handleGetDeviceId);
}
