import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';

// Global error handler for debugging white screens
window.addEventListener('error', (event) => {
  const root = document.getElementById('root');
  if (root && root.innerHTML === '') {
    root.innerHTML = `<div style="padding: 20px; color: red; font-family: sans-serif;">
      <h2>Application Error</h2>
      <p>${event.message}</p>
      <pre style="font-size: 10px; opacity: 0.5;">${event.filename}:${event.lineno}</pre>
    </div>`;
  }
});

window.addEventListener('unhandledrejection', (event) => {
  const root = document.getElementById('root');
  if (root && root.innerHTML === '') {
    root.innerHTML = `<div style="padding: 20px; color: red; font-family: sans-serif;">
      <h2>Unhandled Promise Rejection</h2>
      <p>${event.reason?.message || event.reason}</p>
    </div>`;
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
