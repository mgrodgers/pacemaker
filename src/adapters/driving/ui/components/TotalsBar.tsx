import type { TotalsView } from '../../../../application/dto/PlanViews';

export function TotalsBar({ totals }: { totals: TotalsView }) {
  return (
    <div
      data-testid="totals-bar"
      style={{
        position: 'sticky',
        bottom: 0,
        marginTop: 'var(--space-5)',
        background: 'var(--color-bg)',
        borderTop: '1px solid var(--color-neutral-700)',
        padding: 'var(--space-3) 0',
        display: 'flex',
        justifyContent: 'space-around',
        textAlign: 'center',
      }}
    >
      <Stat label="Distance" value={totals.distance} size={18} testId="totals-distance" />
      <Stat label="Time" value={totals.time} size={18} testId="totals-time" />
      <Stat label="Avg pace" value={totals.pace} size={18} testId="totals-pace" />
    </div>
  );
}

export function Stat({ label, value, size, testId }: { label: string; value: string; size: number; testId?: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, opacity: 0.55, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div data-testid={testId} style={{ fontFamily: 'var(--font-heading)', fontSize: size, fontWeight: 500 }}>
        {value}
      </div>
    </div>
  );
}
