'use client';

import {
  CONSENT_CATEGORIES,
  pickLocalized,
  TRACKING_DESTINATION_NAMES,
  type ConsentCategory,
  type Locale,
} from '@sanad/contracts';
import { OverlayDialog } from '../../components/overlay';
import { formatCopy } from '../../i18n/format-copy';
import { ConsentCategorySwitch } from '../consent-category-switch/consent-category-switch';
import type { ConsentCopy } from '../types/consent-copy.types';
import { useConsent } from '../use-consent/use-consent';
import { useConsentPreferences } from '../use-consent-preferences/use-consent-preferences';
import { useConsentUi } from '../use-consent-ui/use-consent-ui';

interface ConsentDialogProps {
  copy: ConsentCopy;
  locale: Locale;
}

const TITLE_ID = 'consent-dialog-title';
const LEAD_ID = 'consent-dialog-lead';
const nameId = (category: ConsentCategory) => `consent-cat-${category}`;
const helpId = (category: ConsentCategory) => `consent-cat-${category}-help`;

/**
 * The granular choice, and the only place a visitor can see WHICH third parties a category admits.
 *
 * Naming them is the reason this dialog is worth opening: "marketing" is an abstraction, "Meta
 * pixel" is a fact someone can act on. The list is the same resolved config the tag layer will
 * load from, so it can never describe a state the site is not actually in.
 */
export function ConsentDialog({ copy, locale }: ConsentDialogProps) {
  const { status, policy, destinations } = useConsent();
  const { dialogOpen, closeDialog } = useConsentUi();
  const {
    draft,
    notStored,
    setCategory,
    acceptAll,
    rejectAll,
    save,
    withdraw,
  } = useConsentPreferences();

  // Nothing to configure when the operator switched consent off — offering the choice would imply
  // one that does not exist.
  if (status === 'not-required') return null;

  const isOn = (category: ConsentCategory): boolean =>
    category === 'necessary' ? true : draft[category];

  return (
    <OverlayDialog
      open={dialogOpen}
      onClose={closeDialog}
      labelledBy={TITLE_ID}
      describedBy={LEAD_ID}
      className="consent-dialog"
      header={
        <>
          <h2 id={TITLE_ID} className="consent-dialog-title">
            {copy.dialog.title}
          </h2>
          <button
            type="button"
            className="consent-dialog-close"
            onClick={closeDialog}
            aria-label={copy.dialog.close}
          >
            <span aria-hidden="true">×</span>
          </button>
        </>
      }
      footer={
        <>
          <button type="button" className="consent-action" onClick={acceptAll}>
            {copy.dialog.acceptAll}
          </button>
          <button type="button" className="consent-action" onClick={rejectAll}>
            {copy.dialog.rejectAll}
          </button>
          <button
            type="button"
            className="consent-action consent-action--save"
            onClick={save}
          >
            {copy.dialog.save}
          </button>
        </>
      }
    >
      <p id={LEAD_ID} className="consent-dialog-lead">
        {copy.dialog.lead}
      </p>

      {notStored ? (
        <p role="status" className="consent-dialog-notice">
          {copy.feedback.notStored}
        </p>
      ) : null}

      <ul className="consent-categories">
        {CONSENT_CATEGORIES.map((category) => {
          const locked = category === 'necessary';
          const vendors = destinations.filter((d) => d.category === category);
          return (
            <li key={category}>
              <div
                role="group"
                aria-labelledby={nameId(category)}
                className="consent-category"
              >
                <div className="consent-category-head">
                  <span id={nameId(category)} className="consent-category-name">
                    {copy.categories[category].name}
                  </span>
                  {locked ? (
                    <span className="consent-category-locked">
                      {copy.categories.necessary.alwaysOn}
                    </span>
                  ) : null}
                  <ConsentCategorySwitch
                    checked={isOn(category)}
                    onChange={(next) =>
                      locked ? undefined : setCategory(category, next)
                    }
                    labelId={nameId(category)}
                    describedById={helpId(category)}
                    locked={locked}
                    stateLabel={copy.state}
                  />
                </div>

                <p id={helpId(category)} className="consent-category-help">
                  {copy.categories[category].description}
                </p>

                {/* `necessary` is never gated on a vendor — it is the site working at all — so a
                    "loads if you agree" line there would invent a third party. */}
                {locked ? null : (
                  <p className="consent-category-vendors">
                    {vendors.length > 0 ? (
                      <>
                        <span className="consent-category-vendors-label">
                          {copy.vendors.label}
                        </span>
                        {vendors.map((vendor) => (
                          <span
                            key={vendor.id}
                            className="consent-category-vendor"
                          >
                            {pickLocalized(
                              TRACKING_DESTINATION_NAMES[vendor.id],
                              locale,
                            )}
                          </span>
                        ))}
                      </>
                    ) : (
                      copy.vendors.none
                    )}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <p className="consent-dialog-remembered">
        {formatCopy(
          copy.dialog.remembered,
          { days: policy.rememberDays },
          locale,
        )}
      </p>

      {/* Only when there IS a decision to take back — offering it to someone who has not decided
          would be a control with nothing to do (U23). */}
      {status === 'decided' ? (
        <button
          type="button"
          className="consent-tertiary consent-dialog-withdraw"
          onClick={withdraw}
        >
          {copy.dialog.withdraw}
        </button>
      ) : null}
    </OverlayDialog>
  );
}
