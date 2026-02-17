console.log('🚀 Bootstrapping main.tsx...');
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { ThemeProvider } from './contexts/ThemeContext';

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('❌ Root element not found!');
  } else {
    console.log('📦 Mounting React app...');
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </React.StrictMode>,
    );
    console.log('✅ Mount call complete.');
  }
} catch (err) {
  console.error('💥 Crash in main.tsx render:', err);
}
