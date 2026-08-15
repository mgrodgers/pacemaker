import { beforeEach, describe, expect, test } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsScreen } from '../../../src/adapters/driving/ui/components/SettingsScreen';

beforeEach(() => {
  window.localStorage.clear();
});

describe('SettingsScreen', () => {
  test('renders an Appearance radiogroup with System, Light, and Dark options', () => {
    render(<SettingsScreen onBack={() => {}} />);
    const group = screen.getByRole('radiogroup', { name: 'Appearance' });
    expect(within(group).getByLabelText('System')).toBeInTheDocument();
    expect(within(group).getByLabelText('Light')).toBeInTheDocument();
    expect(within(group).getByLabelText('Dark')).toBeInTheDocument();
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
