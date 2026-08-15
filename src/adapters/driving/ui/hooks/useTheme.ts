import { useCallback, useEffect, useState } from 'react';
import { loadTheme, saveTheme, type ThemePreference } from '../../../driven/persistence/themePreferenceStorage';

export type { ThemePreference };

/** Applies the chosen preference to <html data-theme>, which tokens.css's
 * light-mode overrides key off — "system" means the attribute is removed
 * entirely so the prefers-color-scheme media query takes over. */
export function useTheme() {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => loadTheme());

  useEffect(() => {
    if (preference === 'system') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', preference);
    }
  }, [preference]);

  const setPreference = useCallback((next: ThemePreference) => {
    saveTheme(next);
    setPreferenceState(next);
  }, []);

  return { preference, setPreference };
}
