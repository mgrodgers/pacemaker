import { useState } from 'react';
import { FeedbackModal } from './FeedbackModal';
import { FeedbackIcon } from './icons';

/** Self-contained: owns its own open/closed state, so it can be dropped
 * into the app once without threading callbacks through every screen. */
export function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="btn btn-primary btn-icon"
        aria-label="Send feedback"
        data-testid="feedback-button"
        style={{
          position: 'fixed',
          right: 'var(--space-4)',
          bottom: 'var(--space-4)',
          borderRadius: '50%',
          background: 'var(--color-surface)',
          boxShadow: 'var(--shadow-md)',
          zIndex: 15,
        }}
        onClick={() => setIsOpen(true)}
      >
        <FeedbackIcon />
      </button>
      {isOpen && <FeedbackModal onClose={() => setIsOpen(false)} />}
    </>
  );
}
