export type GameDifficulty = 'easy' | 'hard' | 'endless';

export type GameSettings = {
  bloodEnabled: boolean;
  sensitivity: number;
  difficulty: GameDifficulty;
};

const STORAGE_KEY = 'doppleganger-game-settings';

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  bloodEnabled: true,
  sensitivity: 1,
  difficulty: 'easy',
};

function validSensitivity(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(2, Math.max(0.35, value))
    : DEFAULT_GAME_SETTINGS.sensitivity;
}

export function loadGameSettings(): GameSettings {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return DEFAULT_GAME_SETTINGS;
    const parsed = JSON.parse(saved) as Partial<GameSettings>;
    return {
      bloodEnabled:
        typeof parsed.bloodEnabled === 'boolean'
          ? parsed.bloodEnabled
          : DEFAULT_GAME_SETTINGS.bloodEnabled,
      sensitivity: validSensitivity(parsed.sensitivity),
      difficulty:
        parsed.difficulty === 'hard' || parsed.difficulty === 'endless'
          ? parsed.difficulty
          : 'easy',
    };
  } catch {
    return DEFAULT_GAME_SETTINGS;
  }
}

export function difficultyMultiplier(settings: GameSettings, shiftNumber = 1) {
  if (settings.difficulty === 'hard') return 2;
  if (settings.difficulty === 'endless') return 1 + Math.max(0, shiftNumber - 1) * 0.12;
  return 1;
}

export function saveGameSettings(settings: GameSettings) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // The settings still work for this session when storage is unavailable.
  }
}
