const onlyDigits = (s: string): string => s.replace(/\D/g, '');

/** Reformats a mm:ss (or h:mm:ss, etc.) duration field's raw value after a
 * keystroke, for use with a digit-only mobile keypad (inputMode="numeric")
 * that has no colon key. Digits accumulate left-to-right; once there are
 * more than 2, a colon is inserted before the last 2 (the seconds).
 * Backspacing over the auto-inserted colon drops the digit before it too,
 * so backspace never appears to do nothing. */
export function formatDurationKeystrokes(previous: string, next: string): string {
  let digits = onlyDigits(next);
  if (next.length < previous.length && digits.length === onlyDigits(previous).length) {
    digits = digits.slice(0, -1);
  }
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, -2)}:${digits.slice(-2)}`;
}
