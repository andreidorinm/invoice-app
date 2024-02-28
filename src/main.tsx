import React from 'react'
import ReactDOM from 'react-dom/client'
import LicenseKeyEntry from './components/LicenseKeyEntry.tsx'
import {
  HashRouter,
  Route,
  Routes
} from "react-router-dom";
import './index.css'
import App from './App.tsx';
import LicenseKeyProvider from './providers/LicenseKeyProvider.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <LicenseKeyProvider>
        <Routes>
          <Route path='/' Component={LicenseKeyEntry} />
          <Route path='/app' Component={App} />
        </Routes>
      </LicenseKeyProvider>
    </HashRouter>
  </React.StrictMode>,
)

// Remove Preload scripts loading
postMessage({ payload: 'removeLoading' }, '*')
console.log(import.meta.env.VITE_LEMON_SQUEEZY_ACTIVATE_URL); // This should log the URL if everything is correct



// Use contextBridge
window.ipcRenderer.on('main-process-message', (_event, message) => {
  console.log(message)
})
