export type ShiftStats = {
  shots: number;
  purchases: number;
  anomaliesShot: number;
};

export function createShiftStats(): ShiftStats {
  return {
    shots: 0,
    purchases: 0,
    anomaliesShot: 0,
  };
}
