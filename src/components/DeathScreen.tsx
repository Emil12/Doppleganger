import { type DeathSummaryStats } from '../lib/gameShift';
import './DeathScreen.css';

type DeathScreenProps = {
  stats: DeathSummaryStats;
  onRestart: () => void;
};

function survivalTime(milliseconds: number) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function DeathScreen({ stats, onRestart }: DeathScreenProps) {
  const rows = [
    ['TIME SURVIVED', survivalTime(stats.survivalMs)],
    ['SHIFTS COMPLETED', stats.shiftsCompleted],
    ['CUSTOMERS SERVED', stats.purchases],
    ['ANOMALIES ELIMINATED', stats.anomaliesShot],
    ['SHOTS FIRED', stats.shots],
    ['DAMAGE TAKEN', stats.damageTaken],
    ['MEDKITS USED', stats.medkitsUsed],
  ];

  return (
    <div className="death-screen" role="dialog" aria-modal="true" aria-label="You died">
      <div className="death-screen__vignette" aria-hidden="true" />
      <div className="death-screen__content">
        <span className="death-screen__eyebrow">RUN TERMINATED</span>
        <h2>YOU DIED</h2>
        <p>FINAL RUN STATISTICS</p>
        <dl>
          {rows.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <button type="button" onClick={onRestart}>START A NEW RUN</button>
      </div>
    </div>
  );
}
