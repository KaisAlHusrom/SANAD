import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { ConfirmationRoot, Toaster } from '../components/feedback';
import { GlobalModalManager } from '../components/modal';
import { DialogStackProvider } from '../components/ui/dialog-stack';
import '../data/store/register-apis';
import './modals.config';
import { createAppStore } from '../data/store/store';
import { BrandingThemeProvider } from '../providers/branding';
import { DirectionProvider } from '../providers/direction';
import { router } from './router';

// One store instance for the app (tests build their own via createAppStore).
const store = createAppStore();

/**
 * App composition root: Redux store → direction sync → dialog-stack tracking → router + the
 * global overlay hosts (modal registry, confirmation, toasts), each mounted exactly once (W1).
 * The Toaster is last so its toasts paint above an open dialog.
 *
 * `DialogStackProvider` wraps everything that can open a dialog so a nested one (a media picker
 * opened from inside a form modal) knows its depth and renders as a LAYER above its parent
 * rather than as a second identical box beside it.
 */
export function App() {
  return (
    <Provider store={store}>
      <DirectionProvider>
        <BrandingThemeProvider>
          <DialogStackProvider>
            <RouterProvider router={router} />
            <GlobalModalManager />
            <ConfirmationRoot />
          </DialogStackProvider>
          <Toaster />
        </BrandingThemeProvider>
      </DirectionProvider>
    </Provider>
  );
}
