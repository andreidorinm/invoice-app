import { contextBridge, ipcRenderer } from 'electron'
import { IPC_ACTIONS } from './IPC/IPCActions';

const {
  SET_LICENSE_KEY,
  GET_LICENSE_KEY,
  SET_MARKUP_PERCENTAGE,
  GET_MARKUP_PERCENTAGE,
  SET_VAT_PAYER_STATUS,
  GET_VAT_PAYER_STATUS,
  SELECT_SAVE_PATH,
  OPEN_FILE_DIALOG,
  SET_FACTURIS_TYPE,
  GET_FACTURIS_TYPE,
  GET_DEVICE_ID
} = IPC_ACTIONS.Window;

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', withPrototype(ipcRenderer))

// `exposeInMainWorld` can't detect attributes and methods of `prototype`, manually patching it.
function withPrototype(obj: Record<string, any>) {
  const protos = Object.getPrototypeOf(obj)

  for (const [key, value] of Object.entries(protos)) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) continue

    if (typeof value === 'function') {
      // Some native APIs, like `NodeJS.EventEmitter['on']`, don't work in the Renderer process. Wrapping them into a function.
      obj[key] = function (...args: any) {
        return value.call(obj, ...args)
      }
    } else {
      obj[key] = value
    }
  }
  return obj
}

// --------- Preload scripts loading ---------
function domReady(condition: DocumentReadyState[] = ['complete', 'interactive']) {
  return new Promise(resolve => {
    if (condition.includes(document.readyState)) {
      resolve(true)
    } else {
      document.addEventListener('readystatechange', () => {
        if (condition.includes(document.readyState)) {
          resolve(true)
        }
      })
    }
  })
}

const safeDOM = {
  append(parent: HTMLElement, child: HTMLElement) {
    if (!Array.from(parent.children).find(e => e === child)) {
      parent.appendChild(child)
    }
  },
  remove(parent: HTMLElement, child: HTMLElement) {
    if (Array.from(parent.children).find(e => e === child)) {
      parent.removeChild(child)
    }
  },
}

/**
 * https://tobiasahlin.com/spinkit
 * https://connoratherton.com/loaders
 * https://projects.lukehaas.me/css-loaders
 * https://matejkustec.github.io/SpinThatShit
 */
function useLoading() {
  const className = `loaders-css__square-spin`
  const styleContent = `
@keyframes square-spin {
  25% { transform: perspective(100px) rotateX(180deg) rotateY(0); }
  50% { transform: perspective(100px) rotateX(180deg) rotateY(180deg); }
  75% { transform: perspective(100px) rotateX(0) rotateY(180deg); }
  100% { transform: perspective(100px) rotateX(0) rotateY(0); }
}
.${className} > div {
  animation-fill-mode: both;
  width: 50px;
  height: 50px;
  background: #fff;
  animation: square-spin 3s 0s cubic-bezier(0.09, 0.57, 0.49, 0.9) infinite;
}
.app-loading-wrap {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #282c34;
  z-index: 9;
}
    `
  const oStyle = document.createElement('style')
  const oDiv = document.createElement('div')

  oStyle.id = 'app-loading-style'
  oStyle.innerHTML = styleContent
  oDiv.className = 'app-loading-wrap'
  oDiv.innerHTML = `<div class="${className}"><div></div></div>`

  return {
    appendLoading() {
      safeDOM.append(document.head, oStyle)
      safeDOM.append(document.body, oDiv)
    },
    removeLoading() {
      safeDOM.remove(document.head, oStyle)
      safeDOM.remove(document.body, oDiv)
    },
  }
}

// ----------------------------------------------------------------------

const { appendLoading, removeLoading } = useLoading()
domReady().then(appendLoading)

window.onmessage = ev => {
  ev.data.payload === 'removeLoading' && removeLoading()
}

setTimeout(removeLoading, 4999)

const safeExposeIpcRenderer = () => ({
  setLicenseKey: (key: any) => ipcRenderer.send(SET_LICENSE_KEY, key),
  getLicenseKey: () => ipcRenderer.invoke(GET_LICENSE_KEY),
  setMarkupPercentage: (percentage: any) => ipcRenderer.send(SET_MARKUP_PERCENTAGE, percentage),
  getMarkupPercentage: () => ipcRenderer.invoke(GET_MARKUP_PERCENTAGE),
  setVatPayerStatus: (isVatPayer: any) => ipcRenderer.send(SET_VAT_PAYER_STATUS, isVatPayer),
  getVatPayerStatus: () => ipcRenderer.invoke(GET_VAT_PAYER_STATUS),
  selectSavePath: () => ipcRenderer.invoke(SELECT_SAVE_PATH),
  openFileDialog: () => ipcRenderer.send(OPEN_FILE_DIALOG),
  setFacturisType: (facturisType: any) => ipcRenderer.invoke(SET_FACTURIS_TYPE, facturisType),
  getFacturisType: () => ipcRenderer.invoke(GET_FACTURIS_TYPE),
  getDeviceId: () => ipcRenderer.invoke(GET_DEVICE_ID),
  processFile: (filePath: any) => ipcRenderer.send('process-file', filePath),
  processXmlForFreya: (filePath: string) => ipcRenderer.send('process-xml-for-freya', filePath),
  receiveMessage: (channel: any, func: any) => {
    const validChannels = ['csv-written', 'file-processing-error', 'license-key-updated',  'freya-processing-error'];
    if (validChannels.includes(channel)) {
      const subscription = (_event: any, ...args: any) => func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    }
  },
  removeListener: (channel: string, func: (...args: any[]) => void) => {
    ipcRenderer.removeListener(channel, func);
  }
});

contextBridge.exposeInMainWorld('api', safeExposeIpcRenderer());
