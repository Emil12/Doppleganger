import { Direction } from '../lib/firstPerson';
import './GameControls.css';

type GameControlsProps = {
  onControl: (direction: Direction, pressed: boolean) => void;
  onJump: () => void;
  onSprint: (pressed: boolean) => void;
  onStart: () => void;
};

const arrows: Array<{ direction: Direction; label: string; className: string }> = [
  { direction: 'up', label: '▲', className: 'control-up' },
  { direction: 'left', label: '◀', className: 'control-left' },
  { direction: 'down', label: '▼', className: 'control-down' },
  { direction: 'right', label: '▶', className: 'control-right' },
];

export function GameControls({ onControl, onJump, onSprint, onStart }: GameControlsProps) {
  return (
    <div className="game-controls" aria-label="Movement controls">
      {arrows.map(({ direction, label, className }) => (
        <button
          className={className}
          key={direction}
          type="button"
          aria-label={`Move ${direction}`}
          onPointerDown={(event) => {
            event.preventDefault();
            onStart();
            onControl(direction, true);
          }}
          onPointerUp={() => onControl(direction, false)}
          onPointerCancel={() => onControl(direction, false)}
          onPointerLeave={() => onControl(direction, false)}
        >
          {label}
        </button>
      ))}
      <button
        className="control-sprint"
        type="button"
        aria-label="Sprint"
        onPointerDown={(event) => {
          event.preventDefault();
          onStart();
          onSprint(true);
        }}
        onPointerUp={() => onSprint(false)}
        onPointerCancel={() => onSprint(false)}
        onPointerLeave={() => onSprint(false)}
      >
        RUN
      </button>
      <button
        className="control-jump"
        type="button"
        aria-label="Jump"
        onPointerDown={(event) => {
          event.preventDefault();
          onStart();
          onJump();
        }}
      >
        JUMP
      </button>
    </div>
  );
}
