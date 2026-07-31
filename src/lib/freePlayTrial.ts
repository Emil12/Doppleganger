export const FREE_PLAY_LIMIT_MS = 35 * 60 * 60 * 1000;

const STORAGE_KEY = 'doppleganger-free-play-remaining-ms';

export function loadFreePlayRemainingMs() {
  try {
    const stored = Number(window.localStorage.getItem(STORAGE_KEY));
    if (!Number.isFinite(stored)) return FREE_PLAY_LIMIT_MS;
    return Math.min(FREE_PLAY_LIMIT_MS, Math.max(0, stored));
  } catch {
    return FREE_PLAY_LIMIT_MS;
  }
}

export function saveFreePlayRemainingMs(remainingMs: number) {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      String(Math.min(FREE_PLAY_LIMIT_MS, Math.max(0, remainingMs))),
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
