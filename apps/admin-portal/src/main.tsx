import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/fonts.css';
import './styles/global.css';
import './i18n';
import { App } from './app/app';
import { seedDirection } from './providers/direction';
import { seedTheme } from './providers/theme';
import { injectPortalTheme } from './styles/portal-theme';

// Seed the first frame synchronously, before React mounts (F12): inject the portal
// theme CSS, then apply persisted theme + locale/direction to the document root.
injectPortalTheme();
seedTheme();
seedDirection();

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
