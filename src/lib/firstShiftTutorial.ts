const TUTORIAL_SEEN_KEY = 'doppleganger-first-shift-tutorial-seen';

export function hasSeenFirstShiftTutorial() {
  try {
    return window.localStorage.getItem(TUTORIAL_SEEN_KEY) === 'true';
  } catch {
    return false;
  }
}

export function rememberFirstShiftTutorial() {
  try {
    window.localStorage.setItem(TUTORIAL_SEEN_KEY, 'true');
  } catch {
    // The tutorial can still be completed when storage is unavailable.
  }
}
