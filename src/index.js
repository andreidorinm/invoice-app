const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const xml2js = require('xml2js');
const { format } = require('fast-csv');
const { parseAndTransform } = require('./transformCsv'); // Make sure the path is correct

// Define `mainWindow` at the top level of your main process file
let mainWindow;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  // Initialize the `mainWindow`
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.webContents.openDevTools();

  // Handle window close
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

// Make sure to adjust the app lifecycle events as before
app.on('ready', createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Assume mainWindow is your BrowserWindow instance
ipcMain.on('open-file-dialog', (event) => {
  dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'XML Files', extensions: ['xml'] }]
  }).then(result => {
    if (!result.canceled && result.filePaths.length > 0) {
      const outputDir = path.join(__dirname, 'output'); // Directory for output files

      result.filePaths.forEach(filePath => {
        parseAndTransform(filePath, outputDir, (err, message) => {
          if (err) {
            console.error('Error processing file:', err);
            event.reply('file-processing-error', err.message);
            return;
          }
          console.log(message);
          event.reply('csv-written', message);
        });
      });
    }
  }).catch(err => {
    console.error(err);
  });
});
