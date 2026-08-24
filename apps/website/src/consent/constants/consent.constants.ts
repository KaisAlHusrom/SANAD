/** Where a visitor's decision lives. Read by the blocking bootstrap script AND by the store. */
export const CONSENT_STORAGE_KEY = 'sanad-consent';

/**
 * The shape version of the stored record — bumped only when the record's own fields change.
 * Distinct from the operator's `policyVersion`, which re-asks visitors about the same shape.
 */
export const CONSENT_RECORD_VERSION = 1;

/** Stamped on `<html>` before first paint so CSS, A2b and A3 can read the status without JS state. */
export const CONSENT_STATUS_ATTRIBUTE = 'data-consent';

export const MS_PER_DAY = 86_400_000;

/**
 * How long a Google tag holds its hit while waiting for a `consent update`. It only matters once
 * A3 loads a tag, but it belongs in the defaults call that A2a emits.
 */
export const CONSENT_MODE_WAIT_FOR_UPDATE_MS = 500;
