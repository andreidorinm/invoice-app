import { app, BrowserWindow, Menu } from 'electron';
import path from 'node:path';
import electronStore from 'electron-store';
import { autoUpdater } from 'electron-updater';
import { registerIPCHandlers } from './IPC/IPCHandlers';
import contextMenu from 'electron-context-menu';

// Menu.setApplicationMenu(null);
electronStore.initRenderer();

process.env.DIST = path.join(__dirname, '../dist');
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public');

let win: BrowserWindow | null;
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];

function createWindow() {
  contextMenu({
    menu: (_actions, params, browserWindow) => {
      const isBrowserWindow = browserWindow instanceof BrowserWindow;

      return [
        {
          label: 'Copiază',
          visible: params.selectionText.trim().length > 0,
          click: () => {
            if (isBrowserWindow) {
              browserWindow.webContents.copy();
            }
          }
        },
        {
          label: 'Lipește',
          visible: params.isEditable,
          click: () => {
            if (isBrowserWindow) {
              browserWindow.webContents.paste();
            }
          }
        },
      ];
    }
  });


  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'excel.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      spellcheck: true,
      webSecurity: false,
    },
  });

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString());
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(process.env.DIST, 'index.html'));
  }
}

app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors')


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  registerIPCHandlers();
  createWindow();
  autoUpdater.checkForUpdatesAndNotify();

  autoUpdater.on('update-available', () => {
    win?.webContents.send('update_available');
  });

  autoUpdater.on('update-downloaded', () => {
    win?.webContents.send('update_downloaded');
  });

  autoUpdater.on('error', (err) => {
    win?.webContents.send('update_error', err.toString());
  });

})
