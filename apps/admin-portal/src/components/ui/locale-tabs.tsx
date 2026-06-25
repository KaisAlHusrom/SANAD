import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_ENDONYMS,
  type Locale,
} from '@sanad/contracts';
import type { ReactNode } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';

interface LocaleTabsProps {
  /** Renders the per-locale fields for the given locale (W6 — both locales edited). */
  children: (locale: Locale) => ReactNode;
}

/**
 * A per-locale editing surface (W6): one tab per supported locale (ar default first),
 * labelled by its endonym (العربية / English, U8). The render-prop receives the active
 * locale so the caller wires its `*.ar` / `*.en` fields. Direction follows the document.
 */
export function LocaleTabs({ children }: LocaleTabsProps) {
  return (
    <Tabs defaultValue={DEFAULT_LOCALE}>
      <TabsList>
        {LOCALES.map((locale) => (
          <TabsTrigger key={locale} value={locale}>
            {LOCALE_ENDONYMS[locale]}
          </TabsTrigger>
        ))}
      </TabsList>
      {LOCALES.map((locale) => (
        <TabsContent key={locale} value={locale}>
          {children(locale)}
        </TabsContent>
      ))}
    </Tabs>
  );
}
