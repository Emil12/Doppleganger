import { type ShiftStats } from '../lib/gameShift';
import { type GameDifficulty } from '../lib/gameSettings';
import './ShiftSummary.css';

type ShiftSummaryProps = {
  shiftNumber: number;
  stats: ShiftStats;
  runComplete: boolean;
  coinReward: number;
  rewardPending: boolean;
  rewardAvailable: boolean;
  mode: GameDifficulty;
  onContinue: () => void;
};

export function ShiftSummary({
  shiftNumber,
  stats,
  runComplete,
  coinReward,
  rewardPending,
  rewardAvailable,
  mode,
  onContinue,
}: ShiftSummaryProps) {
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
        {(runComplete || coinReward > 0) && (
          <div className="shift-summary__reward">
            <span>
              {runComplete ? `${mode.toUpperCase()} MODE COMPLETE` : 'ENDLESS MILESTONE'}
            </span>
            <strong>
              {rewardPending
                ? 'CREDITING REWARD…'
                : rewardAvailable ? `+${coinReward} COINS` : 'SIGN IN TO EARN COINS'}
            </strong>
          </div>
        )}
        <button type="button" onClick={onContinue} disabled={rewardPending}>
          {runComplete
            ? 'RETURN TO MAIN MENU'
            : `START SHIFT ${String(shiftNumber + 1).padStart(2, '0')}`}
        </button>
      </div>
    </div>
  );
}
