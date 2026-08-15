import { useFeedbackController } from '../hooks/useFeedbackController';
import type { FeedbackCategory } from '../../../../application/ports/out/FeedbackSubmitter';
import { CloseIcon } from './icons';

interface FeedbackModalProps {
  onClose: () => void;
}

const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  bug: 'Bug',
  'feature-idea': 'Feature idea',
  other: 'Other',
};

export function FeedbackModal({ onClose }: FeedbackModalProps) {
  const { category, setCategory, description, setDescription, submit } = useFeedbackController();

  return (
    <div className="overlay" role="presentation" onClick={onClose}>
      <div
        className="card elev-md"
        role="dialog"
        aria-modal="true"
        aria-label="Send feedback"
        data-testid="feedback-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 500 }}>Send feedback</h2>
          <button type="button" className="btn btn-ghost btn-icon" aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <div className="field">
          <label htmlFor="feedback-category">Category</label>
          <select
            id="feedback-category"
            className="input"
            data-testid="feedback-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as FeedbackCategory)}
          >
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="feedback-description">What&rsquo;s on your mind?</label>
          <textarea
            id="feedback-description"
            className="input"
            data-testid="feedback-description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <button
          type="button"
          className="btn btn-primary btn-block"
          data-testid="feedback-submit"
          disabled={description.trim() === ''}
          onClick={submit}
        >
          Send feedback
        </button>
      </div>
    </div>
  );
}
