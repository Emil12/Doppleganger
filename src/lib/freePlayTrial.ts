export const DEFAULT_FREE_PLAY_HOURS = 50;

const HOUR_MS = 60 * 60 * 1000;
const LEGACY_LIMIT_MS = 35 * HOUR_MS;
const REMAINING_KEY = 'doppleganger-free-play-remaining-ms';
const LIMIT_KEY = 'doppleganger-free-play-limit-ms';

function storedNumber(key: string) {
  const stored = window.localStorage.getItem(key);
  if (stored === null) return null;
  const value = Number(stored);
  return Number.isFinite(value) ? value : null;
}

export function applyFreePlayHours(hours: number) {
  const nextLimit = Math.max(1, hours) * HOUR_MS;
  try {
    const previousLimit = storedNumber(LIMIT_KEY) ?? LEGACY_LIMIT_MS;
    const previousRemaining = storedNumber(REMAINING_KEY) ?? previousLimit;
    const usedTime = Math.max(0, previousLimit - previousRemaining);
    const nextRemaining = Math.max(0, nextLimit - usedTime);
    window.localStorage.setItem(LIMIT_KEY, String(nextLimit));
    window.localStorage.setItem(REMAINING_KEY, String(nextRemaining));
    return nextRemaining;
  } catch {
    return nextLimit;
  }
}

export function loadFreePlayRemainingMs() {
  return applyFreePlayHours(DEFAULT_FREE_PLAY_HOURS);
}

export function saveFreePlayRemainingMs(remainingMs: number) {
  try {
    const limit = storedNumber(LIMIT_KEY) ?? DEFAULT_FREE_PLAY_HOURS * HOUR_MS;
    window.localStorage.setItem(
      REMAINING_KEY,
      String(Math.min(limit, Math.max(0, remainingMs))),
    );
  } catch {
    // Guest play still works when browser storage is unavailable.
  }
}

export function formatFreePlayTime(remainingMs: number) {
  const totalMinutes = Math.ceil(Math.max(0, remainingMs) / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}H ${String(minutes).padStart(2, '0')}M`;
}
