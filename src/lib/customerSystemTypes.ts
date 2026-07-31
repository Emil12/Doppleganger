import { type QueueDialogue } from './customerDialogue';

export type CustomerSystemOptions = {
  onPlayerHit: (inspectorAttack: boolean) => void;
  onAnomalyKilled: (flawless: boolean) => void;
  onInnocentShot: () => void;
  onDialogue: (dialogue: QueueDialogue) => void;
  isBloodEnabled: () => boolean;
  getDifficultyMultiplier: () => number;
};
