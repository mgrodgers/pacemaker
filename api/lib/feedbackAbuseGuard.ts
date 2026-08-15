/** True when the anti-bot decoy field was filled in — genuine submitters
 * never see or fill it, since it's visually hidden and out of tab order. */
export function isHoneypotTripped(honeypot: string | undefined): boolean {
  return Boolean(honeypot);
}
