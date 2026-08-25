import { useRef } from 'react';
import { useCoursePredictorController } from '../hooks/useCoursePredictorController';
import { BackIcon, DeleteIcon } from './icons';

interface CoursePredictorScreenProps {
  onBack: () => void;
}

export function CoursePredictorScreen({ onBack }: CoursePredictorScreenProps) {
  const {
    fileName,
    paceRaw,
    setPaceRaw,
    result,
    error,
    units,
    loadFile,
    predict,
    savedPredictions,
    savePrediction,
    openSavedPrediction,
    deleteSavedPrediction,
  } = useCoursePredictorController();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <nav className="nav" style={{ position: 'sticky', top: 0, zIndex: 5, background: 'var(--color-bg)' }}>
        <button type="button" className="btn btn-ghost btn-icon" aria-label="Back" onClick={onBack}>
          <BackIcon />
        </button>
        <span className="nav-brand">Course Predictor</span>
      </nav>

      <div style={{ padding: 'var(--space-4)', display: 'grid', gap: 'var(--space-4)' }}>
        <div
          className="card"
          data-testid="course-dropzone"
          style={{ padding: 'var(--space-4)', textAlign: 'center', border: '1px dashed var(--color-border)', cursor: 'pointer' }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file) void loadFile(file);
          }}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            data-testid="gpx-file-input"
            type="file"
            accept=".gpx"
            aria-label="Upload GPX file"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void loadFile(file);
              e.target.value = '';
            }}
          />
          {fileName ? <div>{fileName}</div> : <div>Drop a GPX file here, or click to choose one</div>}
        </div>

        <label className="field">
          Target pace
          <input
            className="input"
            aria-label="Target pace"
            placeholder={units === 'mi' ? 'e.g. 8:00 /mi' : 'e.g. 5:41 /km'}
            value={paceRaw}
            onChange={(e) => setPaceRaw(e.target.value)}
          />
        </label>

        <button type="button" className="btn btn-primary" onClick={predict}>
          Predict
        </button>

        {error && (
          <div data-testid="course-predictor-error" role="alert" style={{ color: 'var(--color-danger, #c0392b)' }}>
            {error}
          </div>
        )}

        {result && (
          <div className="card" style={{ padding: 'var(--space-4)' }}>
            <div style={{ fontSize: 12, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Predicted time</div>
            <div data-testid="course-total-time" style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 600 }}>
              {result.totalTime}
            </div>

            <table className="table" data-testid="course-splits-table" style={{ marginTop: 'var(--space-4)', width: '100%' }}>
              <thead>
                <tr>
                  <th>Km</th>
                  <th>Grade</th>
                  <th>Pace (/{units})</th>
                </tr>
              </thead>
              <tbody>
                {result.splits.map((split) => (
                  <tr key={split.km}>
                    <td>{split.km}</td>
                    <td>{split.grade}</td>
                    <td>{split.pace}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <button type="button" className="btn btn-secondary" style={{ marginTop: 'var(--space-4)' }} onClick={savePrediction}>
              Save prediction
            </button>
          </div>
        )}

        {savedPredictions.length > 0 && (
          <div data-testid="saved-predictions-list" style={{ display: 'grid', gap: 'var(--space-2)' }}>
            <div style={{ fontSize: 12, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Saved predictions</div>
            {savedPredictions.map((saved) => (
              <div
                key={saved.id}
                className="card"
                data-testid="saved-prediction-item"
                style={{ padding: 'var(--space-3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <button
                  type="button"
                  className="btn btn-ghost"
                  data-testid="open-saved-prediction"
                  style={{ textAlign: 'left' }}
                  onClick={() => openSavedPrediction(saved)}
                >
                  {saved.fileName} — {saved.totalTime} @ {saved.targetPaceRaw}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-icon"
                  aria-label={`Delete saved prediction ${saved.fileName}`}
                  onClick={() => deleteSavedPrediction(saved.id)}
                >
                  <DeleteIcon />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
