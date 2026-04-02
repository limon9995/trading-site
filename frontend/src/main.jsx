import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import './index.css';
import './i18n/i18n.js';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#161A1E',
          color: '#EAECEF',
          border: '1px solid #2B3139',
          borderRadius: '12px',
          fontSize: '14px',
        },
        success: {
          iconTheme: { primary: '#0ECB81', secondary: '#161A1E' },
        },
        error: {
          iconTheme: { primary: '#F6465D', secondary: '#161A1E' },
        },
      }}
    />
  </React.StrictMode>
);
