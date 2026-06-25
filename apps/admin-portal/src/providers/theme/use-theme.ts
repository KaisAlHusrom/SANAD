import { useCallback, useState } from 'react';
import { applyThemeToDocument } from './seed-theme';
import { readThemeFromStorage, writeTheme, type Theme } from './theme.storage';

interface UseThemeResult {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
}

/** Read + switch the portal theme; persists and updates the document (F11/F12). */
export function useTheme(): UseThemeResult {
  const [theme, setThemeState] = useState<Theme>(
    () => readThemeFromStorage() ?? 'dark',
  );

  const setTheme = useCallback((next: Theme) => {
    writeTheme(next);
    applyThemeToDocument(next);
    setThemeState(next);
  }, []);

  const toggle = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  return { theme, setTheme, toggle };
}
