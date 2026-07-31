import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { type WeaponSlot } from '../lib/weaponTypes';
import './MobileActionControls.css';

export type MobileActionControlsProps = {
  onInteract: () => void;
  onRefuse: () => void;
  onReload: () => void;
  onJump: () => void;
  onSprint: (pressed: boolean) => void;
  onAim: (pressed: boolean) => void;
  onUseMedkit: () => void;
  onSelectSlot: (slot: WeaponSlot) => void;
  onStart?: () => void;
  disabled?: boolean;
  className?: string;
};

function useHeldAction(
  onChange: (pressed: boolean) => void,
  onStart: (() => void) | undefined,
  disabled: boolean,
) {
  const pointerId = useRef<number | null>(null);
  const callbacks = useRef({ onChange, onStart });
  const [isHeld, setIsHeld] = useState(false);
  callbacks.current = { onChange, onStart };

  const release = (releasedPointerId: number) => {
    if (pointerId.current !== releasedPointerId) return;
    pointerId.current = null;
    setIsHeld(false);
    callbacks.current.onChange(false);
  };

  useEffect(() => {
    if (disabled && pointerId.current !== null) release(pointerId.current);
  }, [disabled]);

  useEffect(() => () => {
    if (pointerId.current !== null) callbacks.current.onChange(false);
  }, []);

  const start = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (disabled || pointerId.current !== null) return;
    event.preventDefault();
    pointerId.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsHeld(true);
    callbacks.current.onStart?.();
    callbacks.current.onChange(true);
  };

  const finish = (event: ReactPointerEvent<HTMLButtonElement>) => release(event.pointerId);

  return {
    isHeld,
    handlers: {
      onPointerDown: start,
      onPointerUp: finish,
      onPointerCancel: finish,
      onLostPointerCapture: finish,
    },
  };
}

export function MobileActionControls({
  onInteract,
  onRefuse,
  onReload,
  onJump,
  onSprint,
  onAim,
  onUseMedkit,
  onSelectSlot,
  onStart,
  disabled = false,
  className,
}: MobileActionControlsProps) {
  const sprint = useHeldAction(onSprint, onStart, disabled);
  const aim = useHeldAction(onAim, onStart, disabled);
  const tap = (action: () => void) => () => {
    if (disabled) return;
    onStart?.();
    action();
  };
  const utilityActions = [
    { key: 'interact', label: 'INTERACT', action: onInteract },
    { key: 'refuse', label: 'REFUSE', action: onRefuse },
    { key: 'reload', label: 'RELOAD', action: onReload },
    { key: 'medkit', label: 'MEDKIT', action: onUseMedkit },
    { key: 'slot-1', label: 'SLOT 1', action: () => onSelectSlot(1) },
    { key: 'slot-2', label: 'SLOT 2', action: () => onSelectSlot(2) },
  ];
  const rootClassName = `mobile-action-controls${className ? ` ${className}` : ''}`;

  return (
    <div
      className={rootClassName}
      role="group"
      aria-label="Mobile action controls"
      aria-disabled={disabled}
      onContextMenu={(event) => event.preventDefault()}
    >
      <div className="mobile-action-controls__utility">
        {utilityActions.map(({ key, label, action }) => (
          <button
            className={`mobile-action-controls__button mobile-action-controls__button--${key}`}
            key={key}
            type="button"
            disabled={disabled}
            aria-label={label}
            onClick={tap(action)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="mobile-action-controls__movement">
        <button
          className="mobile-action-controls__button"
          type="button"
          disabled={disabled}
          onClick={tap(onJump)}
        >
          JUMP
        </button>
        <button
          className="mobile-action-controls__button mobile-action-controls__button--hold"
          type="button"
          disabled={disabled}
          aria-label="Hold to sprint"
          aria-pressed={sprint.isHeld}
          data-active={sprint.isHeld}
          {...sprint.handlers}
        >
          SPRINT
        </button>
      </div>
      <button
        className="mobile-action-controls__button mobile-action-controls__aim"
        type="button"
        disabled={disabled}
        aria-label="Hold to aim"
        aria-pressed={aim.isHeld}
        data-active={aim.isHeld}
        {...aim.handlers}
      >
        AIM
      </button>
    </div>
  );
}
