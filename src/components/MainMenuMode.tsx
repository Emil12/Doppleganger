import { type GameDifficulty, type GameSettings } from '../lib/gameSettings';

type MainMenuModeProps = {
  settings: GameSettings;
  onChange: (settings: GameSettings) => void;
  onBack: () => void;
};

const MODES: Array<{ id: GameDifficulty; description: string }> = [
  { id: 'easy', description: 'Survive 10 shifts · 5 coin reward' },
  { id: 'hard', description: 'Faster threats · survive 25 shifts' },
  { id: 'nightmare', description: '4 in 5 are anomalies · survive shift 35' },
  { id: 'endless', description: 'No ending · danger scales forever' },
];

export function MainMenuMode({ settings, onChange, onBack }: MainMenuModeProps) {
  return (
    <div className="mode-panel">
      <header><strong>SELECT MODE</strong><span>CURRENT · {settings.difficulty}</span></header>
      <div className="mode-panel__choices">
        {MODES.map((mode) => (
          <button
            key={mode.id}
            type="button"
            className={settings.difficulty === mode.id ? 'is-selected' : ''}
            onClick={() => onChange({ ...settings, difficulty: mode.id })}
          >
            <strong>{mode.id.toUpperCase()}</strong>
            <small>{mode.description}</small>
          </button>
        ))}
      </div>
      <button type="button" onClick={onBack}>BACK</button>
    </div>
  );
}
