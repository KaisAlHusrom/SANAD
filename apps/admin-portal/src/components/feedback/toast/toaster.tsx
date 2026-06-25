import * as RadixToast from '@radix-ui/react-toast';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../../data/toast';
import { Toast } from './toast';

/**
 * The single toast host (W1 — mounted once in the app shell). Reads the live toasts from
 * the store; the viewport is positioned with logical properties (U7) and the swipe-off
 * direction follows the active direction (RTL → toward the inline-end / left).
 */
export function Toaster() {
  const { i18n } = useTranslation();
  const { toasts } = useToast();
  const swipeDirection = i18n.dir() === 'rtl' ? 'left' : 'right';

  return (
    <RadixToast.Provider swipeDirection={swipeDirection}>
      {toasts.map((record) => (
        <Toast key={record.id} record={record} />
      ))}
      <RadixToast.Viewport className="fixed bottom-0 end-0 z-50 m-0 flex w-[min(24rem,calc(100vw-2rem))] list-none flex-col gap-2 p-4 outline-none" />
    </RadixToast.Provider>
  );
}
