import { describe, expect, test } from 'vitest';
import { formatDurationKeystrokes } from '../../../src/adapters/driving/ui/components/formatDurationKeystrokes';

describe('formatDurationKeystrokes', () => {
  test('digits accumulate without a colon until there are more than 2', () => {
    expect(formatDurationKeystrokes('', '1')).toBe('1');
    expect(formatDurationKeystrokes('1', '12')).toBe('12');
  });

  test('a 3rd digit inserts a colon before the last 2 (seconds)', () => {
    expect(formatDurationKeystrokes('12', '123')).toBe('1:23');
  });

  test('more digits keep shifting the colon', () => {
    expect(formatDurationKeystrokes('1:23', '1:230')).toBe('12:30');
    expect(formatDurationKeystrokes('12:30', '12:305')).toBe('123:05');
  });

  test('backspacing over the auto-inserted colon also removes the digit before it', () => {
    // native backspace on "1:23" with the cursor after ":" removes just the colon, raw = "123"
    expect(formatDurationKeystrokes('1:23', '123')).toBe('12');
  });

  test('ordinary backspace on a digit behaves normally', () => {
    expect(formatDurationKeystrokes('1:23', '1:2')).toBe('12');
  });

  test('empty input stays empty', () => {
    expect(formatDurationKeystrokes('1', '')).toBe('');
  });
});
