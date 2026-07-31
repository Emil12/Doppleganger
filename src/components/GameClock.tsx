import { useEffect, useRef, useState } from 'react';
import {
  GAME_START_HOUR,
  GAME_START_MINUTE,
  GAME_SHIFT_DURATION_MS,
  GAME_SHIFT_HOURS,
} from '../lib/gameTime';
import {
  NIGHTMARE_SHIFT,
  NIGHTMARE_SHIFT_DURATION_MS,
} from '../lib/nightmareEvent';
import './GameClock.css';

type GameClockProps = {
  playing: boolean;
  shiftNumber: number;
  onShiftEnd: () => void;
};

function formatTime(elapsedHours: number) {
  const hour24 = (GAME_START_HOUR + elapsedHours) % 24;
  const hour12 = hour24 % 12 || 12;
  const period = hour24 < 12 ? 'AM' : 'PM';
  const minute = String(GAME_START_MINUTE).padStart(2, '0');
  return `${String(hour12).padStart(2, '0')}:${minute} ${period}`;
}

export function GameClock({ playing, shiftNumber, onShiftEnd }: GameClockProps) {
  const startedAt = useRef<number | null>(null);
  const [elapsedHours, setElapsedHours] = useState(0);

  useEffect(() => {
    startedAt.current = null;
    setElapsedHours(0);
  }, [shiftNumber]);

  useEffect(() => {
    if (!playing) return;
    if (startedAt.current === null) startedAt.current = Date.now();
    const shiftDuration = shiftNumber === NIGHTMARE_SHIFT
      ? NIGHTMARE_SHIFT_DURATION_MS
      : GAME_SHIFT_DURATION_MS;
    const millisecondsPerHour = shiftDuration / GAME_SHIFT_HOURS;
    const updateClock = () => {
      const start = startedAt.current;
      if (start === null) return;
      const elapsedMs = Date.now() - start;
      setElapsedHours(Math.min(Math.floor(elapsedMs / millisecondsPerHour), GAME_SHIFT_HOURS));
      if (elapsedMs >= shiftDuration) onShiftEnd();
    };
    updateClock();
    const timer = window.setInterval(updateClock, 1000);
    return () => window.clearInterval(timer);
  }, [onShiftEnd, playing, shiftNumber]);

  const time = formatTime(elapsedHours);
  return (
    <div className="game-clock" role="timer" aria-label={`Local time ${time}`}>
      <span>LOCAL TIME</span>
      <strong>{time}</strong>
    </div>
  );
}
