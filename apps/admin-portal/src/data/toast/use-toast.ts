import { useSyncExternalStore } from 'react';
import { toastStore } from './toast-store';
import type { ToastOptions, ToastRecord, ToastVariant } from './toast.types';

/** Settle toasts (success/error from `toast.promise`) auto-dismiss after this window. */
const PROMISE_DURATION = 4000;

type VariantOptions = Omit<ToastOptions, 'title' | 'variant'>;

/** Messages for `toast.promise`; success/error may derive from the settled value/error. */
export interface ToastPromiseMessages<T> {
  loading: string;
  success: string | ((value: T) => string);
  error: string | ((error: unknown) => string);
}

function resolveMessage<A>(
  message: string | ((arg: A) => string),
  arg: A,
): string {
  return typeof message === 'function' ? message(arg) : message;
}

function variantToast(variant: ToastVariant) {
  return (title: string, options?: VariantOptions): string =>
    toastStore.add({ ...options, title, variant });
}

function toastPromise<T>(
  promise: Promise<T>,
  messages: ToastPromiseMessages<T>,
): Promise<T> {
  const id = toastStore.add({
    title: messages.loading,
    variant: 'loading',
    duration: 0,
  });
  promise.then(
    (value) =>
      toastStore.update(id, {
        title: resolveMessage(messages.success, value),
        variant: 'success',
        duration: PROMISE_DURATION,
      }),
    (error: unknown) =>
      toastStore.update(id, {
        title: resolveMessage(messages.error, error),
        variant: 'error',
        duration: PROMISE_DURATION,
      }),
  );
  return promise;
}

/** The stable toast trigger: callable + variant shortcuts + `promise` + `dismiss`. */
export interface ToastApi {
  (options: ToastOptions): string;
  success: (title: string, options?: VariantOptions) => string;
  error: (title: string, options?: VariantOptions) => string;
  warning: (title: string, options?: VariantOptions) => string;
  info: (title: string, options?: VariantOptions) => string;
  promise: <T>(
    promise: Promise<T>,
    messages: ToastPromiseMessages<T>,
  ) => Promise<T>;
  dismiss: (id: string) => void;
}

const toastApi: ToastApi = Object.assign(
  (options: ToastOptions): string => toastStore.add(options),
  {
    success: variantToast('success'),
    error: variantToast('error'),
    warning: variantToast('warning'),
    info: variantToast('info'),
    promise: toastPromise,
    dismiss: (id: string): void => toastStore.dismiss(id),
  },
);

/**
 * The app-wide toast trigger. Stable, so it's usable outside React too (e.g. an api-layer
 * handler) — components reach it through `useToast()` to also read the live `toasts`.
 */
export const toast = toastApi;

interface UseToastResult {
  toast: ToastApi;
  dismiss: (id: string) => void;
  toasts: ToastRecord[];
}

/** Read the live toasts + raise/dismiss them; subscribes via `useSyncExternalStore`. */
export function useToast(): UseToastResult {
  const toasts = useSyncExternalStore(
    toastStore.subscribe,
    toastStore.getSnapshot,
  );
  return { toast: toastApi, dismiss: toastApi.dismiss, toasts };
}
