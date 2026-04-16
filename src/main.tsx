import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { LanguageProvider } from './i18n/LanguageContext';

// Deploy marker — bump this string whenever you push a streaming-related fix.
// Visible in the browser Console so you can confirm the browser is running
// the latest build (vs a cached old JS bundle).
console.log(
  '%cThesisEngine build %cstream-accumulator-v2 %c(2026-04-16)',
  'color:#3fb950;font-weight:600',
  'color:#d29922;font-weight:600',
  'color:#8b949e',
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </StrictMode>,
);
