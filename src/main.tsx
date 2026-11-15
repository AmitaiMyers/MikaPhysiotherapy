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

/** How often an open app asks the server for a new version. */
const UPDATE_CHECK_MS = 60 * 60 * 1000;

// Keep the app working offline and pick up new versions automatically. Phones often resume a
// home-screen app instead of restarting it, so also check when it comes back to the foreground.
registerSW({
  immediate: true,
  onRegisteredSW(_url, registration) {
    // No registration when the browser has no service worker support: nothing to update.
    if (registration === undefined) return;
    const check = () => void registration.update();
    setInterval(check, UPDATE_CHECK_MS);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') check();
    });
  },
});

createRoot(required(document.getElementById('root'), 'Missing #root element')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
