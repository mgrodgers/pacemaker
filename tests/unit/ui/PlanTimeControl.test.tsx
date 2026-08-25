import { describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlanTimeControl } from '../../../src/adapters/driving/ui/components/PlanTimeControl';

describe('PlanTimeControl', () => {
  test('renders nothing when the plan has no time to display', () => {
    const { container } = render(
      <PlanTimeControl time={null} onSetStartTime={() => {}} onSetEndTime={() => {}} onClear={() => {}} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  test('renders the start/end fields and a day-offset suffix on the derived side', () => {
    render(
      <PlanTimeControl
        time={{ start: { value: '23:30', dayOffset: 0 }, end: { value: '00:30', dayOffset: 1 } }}
        onSetStartTime={() => {}}
        onSetEndTime={() => {}}
        onClear={() => {}}
      />
    );
    expect(screen.getByLabelText('Start time')).toHaveValue('23:30');
    expect(screen.getByLabelText('End time')).toHaveValue('00:30');
    expect(screen.getByTestId('plan-time-start-offset')).toHaveTextContent('');
    expect(screen.getByTestId('plan-time-end-offset')).toHaveTextContent('+1d');
  });

  test('editing a field calls its handler with the raw value', () => {
    const onSetStartTime = vi.fn();
    render(
      <PlanTimeControl
        time={{ start: { value: '06:00', dayOffset: 0 }, end: { value: '06:45', dayOffset: 0 } }}
        onSetStartTime={onSetStartTime}
        onSetEndTime={() => {}}
        onClear={() => {}}
      />
    );
    fireEvent.change(screen.getByLabelText('Start time'), { target: { value: '07:00' } });
    expect(onSetStartTime).toHaveBeenCalledWith('07:00');
  });

  test('clicking clear calls onClear', async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    render(
      <PlanTimeControl
        time={{ start: { value: '06:00', dayOffset: 0 }, end: { value: '06:45', dayOffset: 0 } }}
        onSetStartTime={() => {}}
        onSetEndTime={() => {}}
        onClear={onClear}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Clear time' }));
    expect(onClear).toHaveBeenCalled();
  });
});
