import { useCallback, useState } from 'react';
import { useFeedbackService } from './useFeedbackService';
import type { FeedbackCategory } from '../../../../application/ports/out/FeedbackSubmitter';
import { FeedbackRateLimitedError } from '../../../../application/errors/FeedbackError';

export type FeedbackStatus = 'idle' | 'submitting' | 'success' | 'error' | 'rate-limited';

/** Drives the feedback form: owns the draft fields and submission status,
 * and calls FeedbackService to submit. */
export function useFeedbackController() {
  const service = useFeedbackService();
  const [category, setCategory] = useState<FeedbackCategory>('bug');
  const [description, setDescription] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [status, setStatus] = useState<FeedbackStatus>('idle');

  const submit = useCallback(async () => {
    setStatus('submitting');
    try {
      await service.submitFeedback({ category, description, honeypot });
      setStatus('success');
      setDescription('');
    } catch (error) {
      setStatus(error instanceof FeedbackRateLimitedError ? 'rate-limited' : 'error');
    }
  }, [service, category, description, honeypot]);

  return { category, setCategory, description, setDescription, honeypot, setHoneypot, status, submit };
}
