import { type MutableRefObject, useEffect } from 'react';

const REGEN_INTERVAL_MS = 3_000;

export function useHealthRegeneration(
  active: boolean,
  healthRef: MutableRefObject<number>,
  maxHealthRef: MutableRefObject<number>,
  showHealth: (health: number) => void,
) {
  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => {
      if (healthRef.current >= maxHealthRef.current) return;
      healthRef.current = Math.min(maxHealthRef.current, healthRef.current + 1);
      showHealth(healthRef.current);
    }, REGEN_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [active, healthRef, maxHealthRef, showHealth]);
}
