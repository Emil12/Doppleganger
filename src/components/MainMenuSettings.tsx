import { type GameSettings } from '../lib/gameSettings';

type MainMenuSettingsProps = {
  settings: GameSettings;
  onChange: (settings: GameSettings) => void;
  onBack: () => void;
};

export function MainMenuSettings({ settings, onChange, onBack }: MainMenuSettingsProps) {
  return (
    <div className="settings-panel">
      <div className="settings-panel__heading">
        <strong>SETTINGS</strong>
        <span>SAVED AUTOMATICALLY</span>
      </div>
      <label className="settings-toggle">
        <span>BLOOD EFFECTS<small>Puddles, trails, and screen blood</small></span>
        <input
          type="checkbox"
          checked={settings.bloodEnabled}
          onChange={(event) => onChange({
            ...settings,
            bloodEnabled: event.target.checked,
          })}
        />
      </label>
      <label className="sensitivity-setting">
        <span>LOOK SENSITIVITY<strong>{Math.round(settings.sensitivity * 100)}%</strong></span>
        <input
          type="range"
          min="0.35"
          max="2"
          step="0.05"
          value={settings.sensitivity}
          onChange={(event) => onChange({
            ...settings,
            sensitivity: Number(event.target.value),
          })}
        />
      </label>
      <button type="button" onClick={onBack}>BACK</button>
    </div>
  );
}
