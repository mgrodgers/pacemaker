import { beforeEach, describe, expect, test } from 'vitest';
import { loadTheme, saveTheme, type ThemePreference } from '../../../../src/adapters/driven/persistence/themePreferenceStorage';

beforeEach(() => {
  window.localStorage.clear();
});

describe('themePreferenceStorage', () => {
  test('loadTheme defaults to "system" when nothing is stored', () => {
    expect(loadTheme()).toBe('system');
  });

  test.each(['light', 'dark', 'system'] as ThemePreference[])(
    'saveTheme(%s) round-trips through loadTheme',
    (preference) => {
      saveTheme(preference);
      expect(loadTheme()).toBe(preference);
    }
  );

  test('loadTheme falls back to "system" for a corrupted stored value', () => {
    window.localStorage.setItem('runPlanner.themePreference', 'not-a-real-theme');
    expect(loadTheme()).toBe('system');
  });
});
