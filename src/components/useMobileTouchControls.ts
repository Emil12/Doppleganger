import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

export type MobileMoveVector = Readonly<{ x: number; y: number }>;
export type MobileLookDelta = Readonly<{ x: number; y: number }>;

export type MobileTouchCallbacks = {
  onMove: (value: MobileMoveVector) => void;
  onLook: (delta: MobileLookDelta) => void;
  onShoot: (pressed: boolean) => void;
  onStart?: () => void;
};

type MovePointer = { id: number; originX: number; originY: number; radius: number };
const ZERO = { x: 0, y: 0 } as const;

export function useMobileTouchControlsInput(
  options: MobileTouchCallbacks & { disabled: boolean },
) {
  const movePointer = useRef<MovePointer | null>(null);
  const lookPointer = useRef<{ id: number; x: number; y: number } | null>(null);
  const shootPointer = useRef<number | null>(null);
  const callbacks = useRef(options);
  const [stickOffset, setStickOffset] = useState<{ x: number; y: number }>(ZERO);
  const [isShooting, setIsShooting] = useState(false);
  callbacks.current = options;

  const stopMove = (pointerId: number) => {
    if (movePointer.current?.id !== pointerId) return;
    movePointer.current = null;
    setStickOffset(ZERO);
    callbacks.current.onMove(ZERO);
  };

  const stopLook = (pointerId: number) => {
    if (lookPointer.current?.id !== pointerId) return;
    lookPointer.current = null;
  };

  const stopShoot = (pointerId: number) => {
    if (shootPointer.current !== pointerId) return;
    shootPointer.current = null;
    setIsShooting(false);
    callbacks.current.onShoot(false);
  };

  useEffect(() => {
    if (!options.disabled) return;
    if (movePointer.current) stopMove(movePointer.current.id);
    if (lookPointer.current) stopLook(lookPointer.current.id);
    if (shootPointer.current !== null) stopShoot(shootPointer.current);
  }, [options.disabled]);

  useEffect(() => () => {
    if (movePointer.current) callbacks.current.onMove(ZERO);
    if (shootPointer.current !== null) callbacks.current.onShoot(false);
  }, []);

  const updateMove = (clientX: number, clientY: number) => {
    const active = movePointer.current;
    if (!active) return;
    const dx = clientX - active.originX;
    const dy = clientY - active.originY;
    const distance = Math.hypot(dx, dy);
    const scale = distance > active.radius ? active.radius / distance : 1;
    const offset = { x: dx * scale, y: dy * scale };
    setStickOffset(offset);
    callbacks.current.onMove({
      x: offset.x / active.radius,
      y: offset.y / active.radius,
    });
  };

  const startMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (options.disabled || movePointer.current) return;
    event.preventDefault();
    const bounds = event.currentTarget.getBoundingClientRect();
    movePointer.current = {
      id: event.pointerId,
      originX: bounds.left + bounds.width / 2,
      originY: bounds.top + bounds.height / 2,
      radius: Math.max(1, Math.min(bounds.width, bounds.height) * 0.3),
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    callbacks.current.onStart?.();
    updateMove(event.clientX, event.clientY);
  };

  const moveStick = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (movePointer.current?.id !== event.pointerId) return;
    event.preventDefault();
    updateMove(event.clientX, event.clientY);
  };

  const startLook = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (options.disabled || lookPointer.current) return;
    event.preventDefault();
    lookPointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
    callbacks.current.onStart?.();
  };

  const moveLook = (event: ReactPointerEvent<HTMLDivElement>) => {
    const active = lookPointer.current;
    if (!active || active.id !== event.pointerId) return;
    event.preventDefault();
    const delta = { x: event.clientX - active.x, y: event.clientY - active.y };
    active.x = event.clientX;
    active.y = event.clientY;
    if (delta.x !== 0 || delta.y !== 0) callbacks.current.onLook(delta);
  };

  const startShoot = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (options.disabled || shootPointer.current !== null) return;
    event.preventDefault();
    shootPointer.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsShooting(true);
    callbacks.current.onStart?.();
    callbacks.current.onShoot(true);
  };

  const finishMove = (event: ReactPointerEvent<HTMLDivElement>) => stopMove(event.pointerId);
  const finishLook = (event: ReactPointerEvent<HTMLDivElement>) => stopLook(event.pointerId);
  const finishShoot = (event: ReactPointerEvent<HTMLButtonElement>) => stopShoot(event.pointerId);

  return {
    stickOffset,
    isMoving: movePointer.current !== null,
    isShooting,
    joystickHandlers: {
      onPointerDown: startMove,
      onPointerMove: moveStick,
      onPointerUp: finishMove,
      onPointerCancel: finishMove,
      onLostPointerCapture: finishMove,
    },
    lookHandlers: {
      onPointerDown: startLook,
      onPointerMove: moveLook,
      onPointerUp: finishLook,
      onPointerCancel: finishLook,
      onLostPointerCapture: finishLook,
    },
    shootHandlers: {
      onPointerDown: startShoot,
      onPointerUp: finishShoot,
      onPointerCancel: finishShoot,
      onLostPointerCapture: finishShoot,
    },
  };
}
