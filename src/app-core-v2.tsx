import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { ThemeProvider } from './contexts/ThemeContext';

// NUCLEAR CACHE INVALIDATION: Physically Renamed Entry Point
// Version: SYNC_21_99
console.clear();
console.log('--- INSTITUTIONAL TERMINAL CORE: SYNC_21_99 ---');
console.log('[Stability Engine] V2 Entry Point Active. Ghost Cache Purged.');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);
