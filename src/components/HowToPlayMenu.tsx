import './HowToPlayMenu.css';

type HowToPlayMenuProps = {
  onBack: () => void;
};

const controls = [
  ['W A S D', 'MOVE'],
  ['MOUSE', 'LOOK AROUND'],
  ['LEFT CLICK', 'SHOOT'],
  ['RIGHT CLICK', 'AIM'],
  ['R', 'RELOAD'],
  ['SHIFT', 'SPRINT'],
  ['SPACE', 'JUMP'],
  ['C', 'CROUCH'],
  ['E', 'INTERACT / ACCEPT'],
  ['F', 'REFUSE CUSTOMER'],
  ['1', 'HOLSTER WEAPON'],
  ['H', 'USE PORTABLE MEDKIT'],
  ['T', 'STOP BOOMBOX'],
];

export function HowToPlayMenu({ onBack }: HowToPlayMenuProps) {
  return (
    <div className="how-to-play">
      <header>
        <strong>EMPLOYEE HANDBOOK</strong>
        <span>HOW TO SURVIVE</span>
      </header>
      <p>
        Check every customer carefully. Serve humans, refuse suspicious customers,
        and shoot anomalies before they reach you.
      </p>
      <div className="how-to-play__controls">
        {controls.map(([button, action]) => (
          <div key={button}>
            <kbd>{button}</kbd>
            <span>{action}</span>
          </div>
        ))}
      </div>
      <small>
        Hide inside the restroom when chased. Do not shoot innocent customers or
        glass: both remove judgement hearts. Outlaws attack on sight.
      </small>
      <button type="button" onClick={onBack}>BACK</button>
    </div>
  );
}
