import { useTranslation } from 'react-i18next';
import { Badge } from '../../../components/ui/badge';
import type { CapabilityCardModel } from '../hooks/use-integrations-list';
import { ProviderRow } from './provider-row';

interface CapabilityCardProps {
  card: CapabilityCardModel;
  onActivate: (provider: CapabilityCardModel['providers'][number]) => void;
  isActivating: boolean;
}

/**
 * One capability (Storage, Email…) as a card: the capability name, which provider is currently
 * ACTIVE, and a row per offered provider. This is the shape the flat "one row per credential key"
 * page was missing — providers are grouped under the thing they implement, and exactly one is
 * selected.
 */
export function CapabilityCard({
  card,
  onActivate,
  isActivating,
}: CapabilityCardProps) {
  const { t } = useTranslation('integrations');

  return (
    <section className="overflow-hidden rounded-md border border-border bg-surface shadow-portal">
      <header className="flex flex-wrap items-center gap-3 border-b border-border-2 px-4 py-3">
        <h2 className="font-semibold text-text">
          {t(`capability.${card.capability}`)}
        </h2>
        <div className="flex flex-1 items-center justify-end gap-2 text-sm text-dim">
          <span>{t('activeLabel')}</span>
          {card.activeProvider ? (
            <Badge tone="good">{t(`provider.${card.activeProvider}`)}</Badge>
          ) : (
            <Badge tone="warn">{t('status.noneActive')}</Badge>
          )}
        </div>
      </header>

      <div className="flex flex-col">
        {card.providers.map((provider) => (
          <ProviderRow
            key={provider.provider}
            capability={card.capability}
            provider={provider.provider}
            configured={provider.configured}
            fields={provider.status?.fields ?? []}
            isActive={provider.isActive}
            canManage={card.canManage}
            isActivating={isActivating}
            onActivate={() => onActivate(provider)}
          />
        ))}
      </div>
    </section>
  );
}
