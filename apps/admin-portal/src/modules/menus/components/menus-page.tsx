import { menuKeySchema, type MenuKey } from '@sanad/contracts';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRequirePermission } from '../../../app/guards/use-require-permission';
import { EmptyState } from '../../../components/feedback/empty-state';
import { ErrorState } from '../../../components/feedback/error-state';
import { RenderGate } from '../../../components/feedback/render-gate';
import { Skeleton } from '../../../components/feedback/skeleton';
import { Button } from '../../../components/ui/button';
import { cn } from '../../../lib/cn';
import { useDirection } from '../../../providers/direction/use-direction';
import { useCreateMenu } from '../hooks/use-create-menu';
import { useMenusList } from '../hooks/use-menus-list';
import { MenuEditor } from './menu-editor';

/**
 * The menus page (W1): the website's keyed navigation menus (header / footer) as selector tabs;
 * a chosen menu renders its one-level item editor, or — if it hasn't been created yet — an
 * "add this menu" prompt (menus are created on demand). Tokens-only, full RTL (U6/U7).
 */
export function MenusPage() {
  const { t } = useTranslation('menus');
  const { locale } = useDirection();
  const canManage = useRequirePermission('content.manage');
  const { isLoading, isError, byKey } = useMenusList();
  const { create, isLoading: creating } = useCreateMenu();
  const [activeKey, setActiveKey] = useState<MenuKey>('primary');
  const summary = byKey(activeKey);

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-text">{t('title')}</h1>
        <p className="text-sm text-dim">{t('subtitle')}</p>
      </header>

      <RenderGate
        isLoading={isLoading}
        isError={isError}
        skeleton={<Skeleton className="h-32 w-full" />}
        error={<ErrorState message={t('editor.loadError')} />}
      >
        <div className="flex flex-wrap gap-2">
          {menuKeySchema.options.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveKey(key)}
              className={cn(
                'rounded-full border px-4 py-2 text-sm transition-colors',
                key === activeKey
                  ? 'border-accent-line bg-accent-soft text-accent'
                  : 'border-border text-dim hover:border-border-2 hover:text-text',
              )}
            >
              {t(`keys.${key}`)}
            </button>
          ))}
        </div>

        {summary ? (
          <MenuEditor
            key={activeKey}
            menuKey={activeKey}
            menuId={summary.id}
            locale={locale}
            canManage={canManage}
          />
        ) : (
          <EmptyState
            title={t('menu.notCreatedTitle')}
            description={t('menu.notCreatedBody')}
            action={
              canManage ? (
                <Button
                  loading={creating}
                  onClick={() => void create(activeKey)}
                >
                  {t('menu.create')}
                </Button>
              ) : undefined
            }
          />
        )}
      </RenderGate>
    </section>
  );
}
