import type { PublicConsentPolicy } from '@sanad/contracts';
import {
  CONSENT_MODE_WAIT_FOR_UPDATE_MS,
  CONSENT_RECORD_VERSION,
  CONSENT_STATUS_ATTRIBUTE,
  CONSENT_STORAGE_KEY,
  MS_PER_DAY,
} from '../constants/consent.constants';
import { CONSENT_RECORD_KEY_COUNT } from '../types/consent-record.zod.types';

/**
 * The source of the one script that must run before every other script on the page. It denies
 * all six gated Consent Mode v2 signals, then restores this browser's own already-valid
 * decision, then stamps the status on `<html>` so CSS and the React tree can read it before
 * first paint (F12) without a flash.
 *
 * It necessarily re-implements `parseConsentRecord` + `evaluateConsent` in the handful of lines
 * that can run inline, which is a real U3 risk — so its spec runs BOTH implementations over the
 * same stored strings and asserts they agree, rather than grepping this one and hoping.
 * `KEY_COUNT` is that parity's sharpest edge: it is `.strict()` expressed inline, and without it
 * the script granted three ad signals for a record the schema rejects — a visitor would have been
 * tracked while still being asked. Any field added to `consentRecordSchema` MUST land here too.
 *
 * Every interpolated value is a number, a boolean, or a code constant, and all of them go
 * through `JSON.stringify` — a `</script` in this string would end the element early. The
 * gateway's assembler is what guarantees that (it coerces every leg to a boolean or a finite
 * number), and no string field of the policy is ever interpolated.
 */
export function consentBootstrapScript(policy: PublicConsentPolicy): string {
  const key = JSON.stringify(CONSENT_STORAGE_KEY);
  const attribute = JSON.stringify(CONSENT_STATUS_ATTRIBUTE);
  const shapeVersion = JSON.stringify(CONSENT_RECORD_VERSION);
  const policyVersion = JSON.stringify(policy.policyVersion);
  const rememberMs = JSON.stringify(policy.rememberDays * MS_PER_DAY);
  const bannerEnabled = JSON.stringify(policy.bannerEnabled);
  const waitForUpdate = JSON.stringify(CONSENT_MODE_WAIT_FOR_UPDATE_MS);
  const keyCount = JSON.stringify(CONSENT_RECORD_KEY_COUNT);

  return `(function(){var w=window;w.dataLayer=w.dataLayer||[];function g(){w.dataLayer.push(arguments)}w.gtag=w.gtag||g;g('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',functionality_storage:'denied',personalization_storage:'denied',security_storage:'granted',wait_for_update:${waitForUpdate}});var s='pending';if(!${bannerEnabled}){s='not-required'}else{try{var r=JSON.parse(w.localStorage.getItem(${key}));if(r&&typeof r==='object'&&Object.keys(r).length===${keyCount}&&r.v===${shapeVersion}&&r.policyVersion===${policyVersion}&&typeof r.decidedAt==='number'&&r.decidedAt>0&&r.decidedAt%1===0&&typeof r.analytics==='boolean'&&typeof r.marketing==='boolean'&&Date.now()-r.decidedAt<${rememberMs}){s='decided';var u={};if(r.analytics){u.analytics_storage='granted'}if(r.marketing){u.ad_storage='granted';u.ad_user_data='granted';u.ad_personalization='granted'}if(r.analytics||r.marketing){g('consent','update',u)}}}catch(e){}}document.documentElement.setAttribute(${attribute},s)})();`;
}
