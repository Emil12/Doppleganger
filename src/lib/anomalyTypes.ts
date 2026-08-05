export type AnomalyKind = 'screamer' | 'crier' | 'crawler' | 'stalker';

export type AnomalyProfile = {
  speed: number;
  hitPoints: number;
  attackCooldown: number;
  bloodDropInterval: number;
};

export const ANOMALY_PROFILES: Record<AnomalyKind, AnomalyProfile> = {
  screamer: {
    speed: 3,
    hitPoints: 4,
    attackCooldown: 1_250,
    bloodDropInterval: 175,
  },
  crier: {
    speed: 2.6,
    hitPoints: 5,
    attackCooldown: 1_400,
    bloodDropInterval: 210,
  },
  crawler: {
    speed: 3.25,
    hitPoints: 3,
    attackCooldown: 950,
    bloodDropInterval: 260,
  },
  stalker: {
    speed: 2.3,
    hitPoints: 6,
    attackCooldown: 1_650,
    bloodDropInterval: 320,
  },
};

const ANOMALY_KINDS = Object.keys(ANOMALY_PROFILES) as AnomalyKind[];

export function randomAnomalyKind() {
  return ANOMALY_KINDS[Math.floor(Math.random() * ANOMALY_KINDS.length)];
}
