export type CustomerDecisionFeedbackKind = 'first-correct' | 'incorrect';

const FIRST_CORRECT_DECISION_KEY = 'doppleganger-first-correct-decision-seen';

export function hasSeenFirstCorrectDecision() {
  try {
    return window.localStorage.getItem(FIRST_CORRECT_DECISION_KEY) === 'true';
  } catch {
    return false;
  }
}

export function rememberFirstCorrectDecision() {
  try {
    window.localStorage.setItem(FIRST_CORRECT_DECISION_KEY, 'true');
  } catch {
    // The congratulations can still be shown when storage is unavailable.
  }
}
