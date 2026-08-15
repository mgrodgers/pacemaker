import { beforeEach, describe, expect, test } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsScreen } from '../../../src/adapters/driving/ui/components/SettingsScreen';

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
});

describe('SettingsScreen', () => {
  test('renders an Appearance radiogroup with System, Light, and Dark options', () => {
    render(<SettingsScreen onBack={() => {}} />);
    const group = screen.getByRole('radiogroup', { name: 'Appearance' });
    expect(within(group).getByLabelText('System')).toBeInTheDocument();
    expect(within(group).getByLabelText('Light')).toBeInTheDocument();
    expect(within(group).getByLabelText('Dark')).toBeInTheDocument();
  });

  test('choosing Light applies data-theme and persists across remount', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<SettingsScreen onBack={() => {}} />);
    await user.click(screen.getByLabelText('Light'));
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    unmount();

    render(<SettingsScreen onBack={() => {}} />);
    expect(screen.getByLabelText('Light')).toBeChecked();
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  test('choosing System removes the data-theme attribute', async () => {
    const user = userEvent.setup();
    render(<SettingsScreen onBack={() => {}} />);
    await user.click(screen.getByLabelText('Dark'));
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    await user.click(screen.getByLabelText('System'));
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });

  test('renders one row per segment type, each with an editable pace field', () => {
    render(<SettingsScreen onBack={() => {}} />);
    for (const label of ['Warmup', 'Easy', 'Tempo', 'Interval', 'Rest', 'Cooldown']) {
      expect(screen.getByLabelText(`${label} default pace`)).toBeInTheDocument();
    }
  });

  test('editing a pace field and coming back to the screen shows the saved value', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<SettingsScreen onBack={() => {}} />);
    await user.type(screen.getByLabelText('Tempo default pace'), '530');
    unmount();

    render(<SettingsScreen onBack={() => {}} />);
    expect(screen.getByLabelText('Tempo default pace')).toHaveValue('5:30');
  });
});
