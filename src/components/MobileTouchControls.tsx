import { useMobileTouchControlsInput, type MobileTouchCallbacks } from './useMobileTouchControls';
import './MobileTouchControls.css';

export type { MobileLookDelta, MobileMoveVector } from './useMobileTouchControls';

export type MobileTouchControlLabels = {
  controls: string;
  movement: string;
  look: string;
  shoot: string;
};

export type MobileTouchControlsProps = MobileTouchCallbacks & {
  disabled?: boolean;
  className?: string;
  labels?: Partial<MobileTouchControlLabels>;
};

const DEFAULT_LABELS: MobileTouchControlLabels = {
  controls: 'Touch game controls',
  movement: 'Movement joystick',
  look: 'Swipe to look around',
  shoot: 'Hold to shoot',
};

export function MobileTouchControls({
  onMove,
  onLook,
  onShoot,
  onStart,
  disabled = false,
  className,
  labels,
}: MobileTouchControlsProps) {
  const input = useMobileTouchControlsInput({
    onMove,
    onLook,
    onShoot,
    onStart,
    disabled,
  });
  const text = { ...DEFAULT_LABELS, ...labels };
  const rootClassName = `mobile-touch-controls${className ? ` ${className}` : ''}`;

  return (
    <div
      className={rootClassName}
      role="group"
      aria-label={text.controls}
      aria-disabled={disabled}
      onContextMenu={(event) => event.preventDefault()}
    >
      <div
        className="mobile-touch-controls__look"
        role="group"
        aria-label={text.look}
        {...input.lookHandlers}
      />
      <div
        className="mobile-touch-controls__joystick"
        role="group"
        aria-label={text.movement}
        data-active={input.isMoving}
        {...input.joystickHandlers}
      >
        <span
          className="mobile-touch-controls__stick"
          style={{
            transform: `translate3d(${input.stickOffset.x}px, ${input.stickOffset.y}px, 0)`,
          }}
          aria-hidden="true"
        />
      </div>
      <button
        className="mobile-touch-controls__shoot"
        type="button"
        aria-label={text.shoot}
        aria-pressed={input.isShooting}
        disabled={disabled}
        data-active={input.isShooting}
        {...input.shootHandlers}
      >
        <span aria-hidden="true">FIRE</span>
      </button>
    </div>
  );
}
