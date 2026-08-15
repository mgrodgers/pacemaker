import { useState, type ChangeEvent } from 'react';
import { useDefaultPaceSettingsController } from '../hooks/useDefaultPaceSettingsController';
import { useTheme, type ThemePreference } from '../hooks/useTheme';
import type { PaceDefaultEntryView } from '../../../../application/dto/PlanViews';
import type { Units } from '../../../../domain/valueObjects/Units';
import { formatDurationKeystrokes } from './formatDurationKeystrokes';
import { BackIcon } from './icons';

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

interface SettingsScreenProps {
  onBack: () => void;
}

interface PaceDefaultRowProps {
  entry: PaceDefaultEntryView;
  onCommit: (raw: string) => void;
}

function PaceDefaultRow({ entry, onCommit }: PaceDefaultRowProps) {
  const [draft, setDraft] = useState<string | undefined>(undefined);
  const current = draft ?? entry.value;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const next = formatDurationKeystrokes(current, e.target.value);
    setDraft(next);
    onCommit(next);
  };

  return (
    <tr>
      <td>{entry.typeLabel}</td>
      <td>
        <div className="field">
          <label htmlFor={`pace-default-${entry.type}`}>{`${entry.typeLabel} default pace`}</label>
          <input
            id={`pace-default-${entry.type}`}
            className="input"
            inputMode="numeric"
            value={current}
            onChange={handleChange}
            onBlur={() => setDraft(undefined)}
          />
        </div>
      </td>
    </tr>
  );
}

export function SettingsScreen({ onBack }: SettingsScreenProps) {
  const { paceDefaults, setUnits, setPaceDefault } = useDefaultPaceSettingsController();
  const { preference: themePreference, setPreference: setThemePreference } = useTheme();

  return (
    <>
      <nav className="nav" style={{ position: 'sticky', top: 0, zIndex: 5, background: 'var(--color-bg)' }}>
        <span className="nav-brand">Run Planner</span>
        <button
          type="button"
          className="btn btn-ghost btn-icon"
          aria-label="Back to plans"
          style={{ marginLeft: 'auto' }}
          onClick={onBack}
        >
          <BackIcon />
        </button>
      </nav>

      <div style={{ padding: 'var(--space-4)' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 500, marginBottom: 'var(--space-3)' }}>
          Appearance
        </h1>

        <div className="seg" role="radiogroup" aria-label="Appearance" style={{ marginBottom: 'var(--space-6)' }}>
          {THEME_OPTIONS.map(({ value, label }) => (
            <label key={value} className="seg-opt">
              <input
                type="radio"
                name="theme-preference"
                checked={themePreference === value}
                onChange={() => setThemePreference(value)}
              />
              {label}
            </label>
          ))}
        </div>

        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 500, marginBottom: 'var(--space-3)' }}>
          Default paces
        </h1>

        <div className="seg" role="radiogroup" aria-label="Units" style={{ marginBottom: 'var(--space-4)' }}>
          {(['km', 'mi'] as Units[]).map((units) => (
            <label key={units} className="seg-opt">
              <input
                type="radio"
                name="pace-defaults-units"
                checked={paceDefaults.units === units}
                onChange={() => setUnits(units)}
              />
              {units}
            </label>
          ))}
        </div>

        <table className="table" data-testid="pace-defaults-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Default pace (/{paceDefaults.units})</th>
            </tr>
          </thead>
          <tbody>
            {paceDefaults.entries.map((entry) => (
              <PaceDefaultRow key={entry.type} entry={entry} onCommit={(raw) => setPaceDefault(entry.type, raw)} />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
