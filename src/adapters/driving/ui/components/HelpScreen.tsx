import { BackIcon, PlusIcon, RenameIcon, DragHandleIcon, RouteIcon, TotalsIcon } from './icons';

interface HelpScreenProps {
  onBack: () => void;
}

interface HelpSectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

function HelpSection({ icon, title, children }: HelpSectionProps) {
  return (
    <div className="card" style={{ padding: 'var(--space-4)', display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start' }}>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: 'var(--color-surface-2, rgba(127,127,127,0.12))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          color: 'var(--color-accent, currentColor)',
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 500, fontSize: 15, marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 13.5, opacity: 0.75, lineHeight: 1.5 }}>{children}</div>
      </div>
    </div>
  );
}

export function HelpScreen({ onBack }: HelpScreenProps) {
  return (
    <>
      <nav className="nav" style={{ position: 'sticky', top: 0, zIndex: 5, background: 'var(--color-bg)' }}>
        <button
          type="button"
          className="btn btn-ghost btn-icon"
          aria-label="Back to plans"
          onClick={onBack}
        >
          <BackIcon />
        </button>
        <span className="nav-brand">How to use Run Planner</span>
      </nav>

      <div style={{ padding: 'var(--space-4)', display: 'grid', gap: 'var(--space-3)' }}>
        <HelpSection icon={<PlusIcon size={18} />} title="Create a plan">
          Tap the plus button on the plans list to create a plan. Give it a name and it's ready for segments.
        </HelpSection>

        <HelpSection icon={<PlusIcon size={18} />} title="Add a segment">
          Inside a plan, choose a segment type (warmup, easy, tempo, interval, rest, cooldown) to add it to the plan.
        </HelpSection>

        <HelpSection icon={<RenameIcon size={18} />} title="Edit its fields">
          Each segment has three linked fields — time, distance, and pace. Fill in any two and the third is worked out for you.
        </HelpSection>

        <HelpSection icon={<DragHandleIcon size={18} />} title="Reorder segments">
          Drag a segment by its handle to move it earlier or later in the plan.
        </HelpSection>

        <HelpSection icon={<TotalsIcon size={18} />} title="Read the totals and best efforts">
          The totals bar at the bottom of a plan shows the overall time, distance, and pace, plus your best potential effort at standard race distances.
        </HelpSection>

        <HelpSection icon={<RouteIcon size={18} />} title="Use the course predictor">
          Upload a GPX file and a target flat pace in the Course Predictor to get a predicted finish time and per-km splits that account for hills.
        </HelpSection>
      </div>
    </>
  );
}
