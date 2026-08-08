import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';
import { useConfirm } from '../data/confirm/use-confirm';
import type { ConfirmOptions } from '../data/confirm/confirm.types';

/**
 * Guards against losing in-progress edits (U21). While `when` is true: in-app navigations are
 * intercepted with a confirm prompt (react-router `useBlocker`, data-router only), and a native
 * `beforeunload` prompt covers hard reloads / tab-close. `options` supplies the localized prompt.
 * Shared (F9) — the blog editor and the pages-builder both guard unsaved edits with it.
 */
export function useUnsavedGuard(when: boolean, options: ConfirmOptions): void {
  const { confirm } = useConfirm();

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      when && currentLocation.pathname !== nextLocation.pathname,
  );

  useEffect(() => {
    if (blocker.state !== 'blocked') {
      return;
    }
    void confirm(options).then((ok) => {
      if (ok) {
        blocker.proceed();
      } else {
        blocker.reset();
      }
    });
  }, [blocker, confirm, options]);

  useEffect(() => {
    if (!when) {
      return;
    }
    const handler = (event: BeforeUnloadEvent): void => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [when]);
}
