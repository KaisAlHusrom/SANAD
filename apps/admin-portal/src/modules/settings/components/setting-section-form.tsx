import type { SettingSection } from '@sanad/contracts';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui/button';
import { useSettingsSectionForm } from '../hooks/use-settings-section-form';
import { sectionGroups, type FieldGroup } from '../lib/section-layout';
import { SettingFieldControl } from './setting-field-control';

/** Types that read better full-width (their controls are wide). */
const FULL_WIDTH_TYPES = new Set(['localized_text', 'image']);

/**
 * One settings section rendered as an editor card: its descriptor fields in a responsive grid
 * (the deep color families behind an "advanced" disclosure) + a fixed Save/Reset footer with a
 * `border-t` (the design's editor panel). Per-section Save sends only that section's changed
 * keys (`useSettingsSectionForm`). Tokens-only, RTL, ar/en (W6).
 */
export function SettingSectionForm({ section }: { section: SettingSection }) {
  const { t } = useTranslation('settings');
  const { form, onSubmit, onReset, isSubmitting, isDirty } =
    useSettingsSectionForm(section);
  const groups = sectionGroups(section);
  const plain = groups.filter((group) => !group.advanced);
  const advanced = groups.filter((group) => group.advanced);

  const renderGroup = (group: FieldGroup, index: number) => (
    <div
      key={group.titleKey ?? `group-${index}`}
      className="flex flex-col gap-4"
    >
      {group.titleKey ? (
        <h3 className="text-sm font-medium text-text">
          {t(`colorGroups.${group.titleKey}`)}
        </h3>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        {group.fields.map((field) => (
          <div
            key={field.key}
            className={
              FULL_WIDTH_TYPES.has(field.type) ? 'sm:col-span-2' : undefined
            }
          >
            <SettingFieldControl field={field} form={form} />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="flex flex-col overflow-hidden rounded-md border border-border bg-surface shadow-portal"
    >
      <div className="flex flex-col gap-6 p-6">
        {plain.map(renderGroup)}
        {advanced.length > 0 ? (
          <details className="rounded-card border border-border bg-surface-2 p-4">
            <summary className="cursor-pointer text-sm font-medium text-dim">
              {t('colorGroups.advanced')}
            </summary>
            <div className="mt-4 flex flex-col gap-6">
              {advanced.map(renderGroup)}
            </div>
          </details>
        ) : null}
      </div>

      {form.formState.errors.root ? (
        <p
          className="border-t border-border px-6 py-3 text-sm text-bad"
          role="alert"
        >
          {form.formState.errors.root.message}
        </p>
      ) : null}

      <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
        <Button
          type="button"
          variant="ghost"
          onClick={onReset}
          disabled={!isDirty || isSubmitting}
        >
          {t('actions.reset')}
        </Button>
        <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
          {t('actions.save')}
        </Button>
      </div>
    </form>
  );
}
