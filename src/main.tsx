import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App } from './App';
import { required } from './domain/assert';
import '@fontsource/atkinson-hyperlegible-next/latin-400.css';
import '@fontsource/atkinson-hyperlegible-next/latin-600.css';
import '@fontsource/atkinson-hyperlegible-next/latin-700.css';
import '@fontsource/atkinson-hyperlegible-next/latin-800.css';
import '@fontsource/atkinson-hyperlegible-mono/latin-400.css';
import '@fontsource/atkinson-hyperlegible-mono/latin-600.css';
import './styles/index.css';

// Keep the app working offline and pick up new versions automatically.
registerSW({ immediate: true });

createRoot(required(document.getElementById('root'), 'Missing #root element')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
