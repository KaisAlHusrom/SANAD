/**
 * Google Consent Mode v2, as the bootstrap script speaks it. Declared here rather than reached
 * for with a cast: the script creates these globals, so this file is their contract, and the
 * tag layer (A3) extends the command union rather than re-inventing the shape (U3).
 */
export type ConsentSignalState = 'granted' | 'denied';

export type ConsentSignalName =
  | 'ad_storage'
  | 'ad_user_data'
  | 'ad_personalization'
  | 'analytics_storage'
  | 'functionality_storage'
  | 'personalization_storage'
  | 'security_storage';

export type ConsentSignals = Partial<
  Record<ConsentSignalName, ConsentSignalState>
> & {
  /** Milliseconds a tag holds its hit while a restored decision arrives. */
  wait_for_update?: number;
};

/** `gtag` pushes its raw `arguments` object — the queue is literally a list of those. */
export type DataLayerEntry = IArguments;

export type GtagConsentFn = (
  command: 'consent',
  action: 'default' | 'update',
  signals: ConsentSignals,
) => void;

declare global {
  interface Window {
    dataLayer?: DataLayerEntry[];
    gtag?: GtagConsentFn;
  }
}
