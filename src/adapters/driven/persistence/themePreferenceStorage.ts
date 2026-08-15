export type ThemePreference = 'light' | 'dark' | 'system';

// Keep this key in sync with the inline bootstrap script in index.html,
// which reads it before React mounts to avoid a flash of the wrong theme.
const STORAGE_KEY = 'runPlanner.themePreference';
const DEFAULT_THEME_PREFERENCE: ThemePreference = 'system';
const VALID_PREFERENCES: readonly ThemePreference[] = ['light', 'dark', 'system'];

export function loadTheme(): ThemePreference {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return VALID_PREFERENCES.includes(raw as ThemePreference) ? (raw as ThemePreference) : DEFAULT_THEME_PREFERENCE;
  } catch {
    return DEFAULT_THEME_PREFERENCE;
  }
}

export function saveTheme(preference: ThemePreference): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, preference);
  } catch {
    /* storage may be unavailable; in-memory copy still works this session */
  }
}
