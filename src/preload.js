const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  processFile: (filePath) => ipcRenderer.send('process-file', filePath),
  openFileDialog: () => {
    console.log('Opening file dialog...');
    ipcRenderer.send('open-file-dialog');
  },
  receive: (channel, func) => {
    let validChannels = ['file-processed', 'display-json']; // Combine valid channels here
    if (validChannels.includes(channel)) {
      // Now this setup can handle multiple channels
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  }
});
