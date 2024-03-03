import React from 'react';
import ReactDOM from 'react-dom/client';
import LicenseKeyEntry from './components/LicenseKeyEntry.tsx';
import { HashRouter, Route, Routes } from "react-router-dom";
import './index.css';
import App from './App.tsx';
import LicenseKeyProvider from './providers/LicenseKeyProvider.tsx';

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <HashRouter>
        <LicenseKeyProvider>
          <Routes>
            <Route path="/" element={<LicenseKeyEntry />} />
            <Route path="/app" element={<App />} />
          </Routes>
        </LicenseKeyProvider>
      </HashRouter>
    </React.StrictMode>,
  );

  postMessage({ payload: 'removeLoading' }, '*');
  console.log(import.meta.env.VITE_LEMON_SQUEEZY_ACTIVATE_URL); // This should log the URL if everything is correct
} else {
  console.error("Failed to find the root element");
}

window.ipcRenderer.on('main-process-message', (_event, message) => {
  console.log(message);
});
