import { type ShiftStats } from '../lib/gameShift';
import './ShiftSummary.css';

type ShiftSummaryProps = {
  shiftNumber: number;
  stats: ShiftStats;
  onContinue: () => void;
};

export function ShiftSummary({ shiftNumber, stats, onContinue }: ShiftSummaryProps) {
  return (
    <div className="shift-summary" role="dialog" aria-modal="true" aria-label="Shift summary">
      <div className="shift-summary__content">
        <span className="shift-summary__eyebrow">06:00 AM</span>
        <h2>SHIFT {String(shiftNumber).padStart(2, '0')} COMPLETE</h2>
        <dl>
          <div>
            <dt>SHOTS FIRED</dt>
            <dd>{stats.shots}</dd>
          </div>
          <div>
            <dt>PURCHASES</dt>
            <dd>{stats.purchases}</dd>
          </div>
          <div>
            <dt>ANOMALIES SHOT</dt>
            <dd>{stats.anomaliesShot}</dd>
          </div>
        </dl>
        <button type="button" onClick={onContinue}>
          START SHIFT {String(shiftNumber + 1).padStart(2, '0')}
        </button>
      </div>
    </div>
  );
}
