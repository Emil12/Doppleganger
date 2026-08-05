import { type CustomerDecisionFeedbackKind } from '../lib/customerDecisionFeedback';
import './CustomerDecisionFeedback.css';

type CustomerDecisionFeedbackProps = {
  kind: CustomerDecisionFeedbackKind;
};

export function CustomerDecisionFeedback({ kind }: CustomerDecisionFeedbackProps) {
  const isCorrect = kind === 'first-correct';

  return (
    <div
      className={`customer-feedback customer-feedback--${isCorrect ? 'correct' : 'incorrect'}`}
      role="status"
      aria-live="assertive"
    >
      <span>{isCorrect ? 'CONGRATULATIONS' : 'INCORRECT'}</span>
      <strong>{isCorrect ? 'FIRST CUSTOMER SERVED!' : 'THAT CUSTOMER WAS AN ANOMALY'}</strong>
      <p>
        {isCorrect
          ? 'Good judgement. Keep checking every customer.'
          : 'Do not let anomalies buy. Refuse them next time.'}
      </p>
    </div>
  );
}
