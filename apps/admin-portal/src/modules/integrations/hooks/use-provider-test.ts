import type {
  IntegrationCapability,
  IntegrationProviderId,
  IntegrationTestResult,
} from '@sanad/contracts';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTestProviderMutation } from '../api/integrations.api';

interface UseProviderTestResult {
  run: (
    capability: IntegrationCapability,
    provider: IntegrationProviderId,
  ) => Promise<void>;
  result: IntegrationTestResult | null;
  isTesting: boolean;
  clear: () => void;
}

/**
 * "Test connection" logic (U5). The probe is routed by the gateway to the service that owns the
 * capability's adapter, and answers `{ ok, message }` — a bad credential is a RESULT, not an
 * error, so it renders inline instead of toasting. A transport failure still degrades to a
 * readable message rather than throwing at the component.
 */
export function useProviderTest(): UseProviderTestResult {
  const { t } = useTranslation('integrations');
  const [testProvider, { isLoading }] = useTestProviderMutation();
  const [result, setResult] = useState<IntegrationTestResult | null>(null);

  return {
    isTesting: isLoading,
    result,
    clear: () => setResult(null),
    run: async (capability, provider) => {
      setResult(null);
      try {
        setResult(await testProvider({ capability, provider }).unwrap());
      } catch {
        setResult({ ok: false, message: t('test.failed') });
      }
    },
  };
}
