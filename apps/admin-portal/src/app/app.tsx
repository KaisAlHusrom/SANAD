import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { ConfirmationRoot, Toaster } from '../components/feedback';
import { GlobalModalManager } from '../components/modal';
import '../data/store/register-apis';
import './modals.config';
import { createAppStore } from '../data/store/store';
import { DirectionProvider } from '../providers/direction';
import { router } from './router';

// One store instance for the app (tests build their own via createAppStore).
const store = createAppStore();

/**
 * App composition root: Redux store → direction sync → router + the global overlay hosts
 * (modal registry, confirmation, toasts), each mounted exactly once (W1). The Toaster is
 * last so its toasts paint above an open dialog.
 */
export function App() {
  return (
    <Provider store={store}>
      <DirectionProvider>
        <RouterProvider router={router} />
        <GlobalModalManager />
        <ConfirmationRoot />
        <Toaster />
      </DirectionProvider>
    </Provider>
  );
}
