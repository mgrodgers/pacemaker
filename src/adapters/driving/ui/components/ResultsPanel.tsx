import type { BestEffortView, TotalsView } from '../../../../application/dto/PlanViews';
import { BestEffortsTable } from './BestEffortsTable';
import { Stat } from './TotalsBar';

interface ResultsPanelProps {
  totals: TotalsView;
  bestEfforts: readonly BestEffortView[];
}

export function ResultsPanel({ totals, bestEfforts }: ResultsPanelProps) {
  return (
    <>
      <div className="card elev-md" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
        <div className="card-kicker">Plan summary</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
          <Stat label="Distance" value={totals.distance} size={26} />
          <Stat label="Time" value={totals.time} size={26} />
          <Stat label="Avg pace" value={totals.pace} size={26} />
        </div>
      </div>

      <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.55, marginBottom: 'var(--space-2)' }}>
        Best potential efforts
      </div>
      {bestEfforts.length > 0 ? (
        <BestEffortsTable rows={bestEfforts} />
      ) : (
        <p style={{ opacity: 0.6, fontSize: 13 }}>
          This plan doesn&apos;t cover 1&nbsp;km yet — add more distance to see potential effort times.
        </p>
      )}
    </>
  );
}
