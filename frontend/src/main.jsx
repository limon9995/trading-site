import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import './index.css';
import './i18n/i18n.js';

// Auto-reload once when a chunk fails to load after a new deployment
function handleChunkError() {
  if (!sessionStorage.getItem('chunk_reload')) {
    sessionStorage.setItem('chunk_reload', '1');
    window.location.reload();
  }
}
// Vite modulepreload failures
window.addEventListener('vite:preloadError', handleChunkError);
// Dynamic import() TypeError rejections (e.g. cached HTML serving old hashed chunks)
window.addEventListener('unhandledrejection', (e) => {
  const msg = e.reason?.message || '';
  if (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('error loading dynamically imported module') ||
    msg.includes('Importing a module script failed')
  ) {
    handleChunkError();
  }
});

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
