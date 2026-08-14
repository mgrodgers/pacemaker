import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FieldTriad } from '../../../src/adapters/driving/ui/components/FieldTriad';

describe('FieldTriad', () => {
  test('the distance field opens a decimal keypad on mobile', () => {
    render(
      <FieldTriad
        name="seg1"
        unitLabel="km"
        mode="distance-pace"
        time={{ value: '10:00', editable: false }}
        distance={{ value: '2', editable: true }}
        pace={{ value: '5:00', editable: true }}
        onModeChange={() => {}}
        onFieldChange={() => {}}
      />
    );
    expect(screen.getByLabelText('Distance (km)')).toHaveAttribute('inputmode', 'decimal');
  });

  test('the derived field is read-only; the other two are editable', () => {
    render(
      <FieldTriad
        name="seg1"
        unitLabel="km"
        mode="distance-pace"
        time={{ value: '10:00', editable: false }}
        distance={{ value: '2', editable: true }}
        pace={{ value: '5:00', editable: true }}
        onModeChange={() => {}}
        onFieldChange={() => {}}
      />
    );
    expect(screen.getByLabelText('Time (mm:ss)')).toHaveAttribute('readonly');
    expect(screen.getByLabelText('Distance (km)')).not.toHaveAttribute('readonly');
    expect(screen.getByLabelText('Pace (/km)')).not.toHaveAttribute('readonly');
  });

  test('editing an editable field calls onFieldChange with the field name and raw value', async () => {
    const user = userEvent.setup();
    const changes: Array<[string, string]> = [];
    render(
      <FieldTriad
        name="seg1"
        unitLabel="km"
        mode="distance-pace"
        time={{ value: '10:00', editable: false }}
        distance={{ value: '2', editable: true }}
        pace={{ value: '5:00', editable: true }}
        onModeChange={() => {}}
        onFieldChange={(field, raw) => changes.push([field, raw])}
      />
    );
    await user.type(screen.getByLabelText('Distance (km)'), '5');
    expect(changes.at(-1)).toEqual(['distance', '25']); // appended to the existing "2"
  });

  test('clicking a mode option calls onModeChange with that mode', async () => {
    const user = userEvent.setup();
    let selected: string | null = null;
    render(
      <FieldTriad
        name="seg1"
        unitLabel="km"
        mode="distance-pace"
        time={{ value: '—', editable: false }}
        distance={{ value: '2', editable: true }}
        pace={{ value: '5:00', editable: true }}
        onModeChange={(mode) => {
          selected = mode;
        }}
        onFieldChange={() => {}}
      />
    );
    await user.click(screen.getByRole('radio', { name: 'Time+Pace' }));
    expect(selected).toBe('time-pace');
  });
});
