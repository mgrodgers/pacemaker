import type { BestEffortView } from '../../../../application/dto/PlanViews';

export function BestEffortsTable({ rows }: { rows: readonly BestEffortView[] }) {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>Distance</th>
          <th>Time</th>
          <th>Pace</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.key} data-testid={`best-effort-${row.key}`}>
            <td>{row.label}</td>
            <td>{row.time}</td>
            <td className="text-muted">{row.pace}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
