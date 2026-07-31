export type ShiftStats = {
  shots: number;
  purchases: number;
  anomaliesShot: number;
};

export type RunStats = ShiftStats & {
  shiftsCompleted: number;
  damageTaken: number;
  medkitsUsed: number;
};

export type DeathSummaryStats = RunStats & {
  survivalMs: number;
};

export function createShiftStats(): ShiftStats {
  return {
    shots: 0,
    purchases: 0,
    anomaliesShot: 0,
  };
}

export function createRunStats(): RunStats {
  return {
    ...createShiftStats(),
    shiftsCompleted: 0,
    damageTaken: 0,
    medkitsUsed: 0,
  };
}
