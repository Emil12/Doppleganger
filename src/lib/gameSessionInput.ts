import { Direction } from './firstPerson';
import { handleGameKey } from './gameInput';

type LookRef = {
  current: { yaw: number; pitch: number };
};

type SessionInputOptions = {
  canvas: HTMLCanvasElement;
  look: LookRef;
  onControl: (direction: Direction, pressed: boolean) => void;
  onJump: () => void;
  onSprint: (pressed: boolean) => void;
  onCrouch: () => void;
  onInteract: () => void;
  onRefuse: () => void;
  onReload: () => void;
  onShoot: () => void;
  onStart: () => void;
};

export function attachGameSessionInput({
  canvas,
  look,
  onControl,
  onJump,
  onSprint,
  onCrouch,
  onInteract,
  onRefuse,
  onReload,
  onShoot,
  onStart,
}: SessionInputOptions) {
  let dragging = false;
  let lastPointer = { x: 0, y: 0 };

  const key = (event: KeyboardEvent, pressed: boolean) => {
    handleGameKey(
      event,
      pressed,
      onControl,
      onJump,
      onSprint,
      onCrouch,
      onInteract,
      onRefuse,
      onReload,
    );
  };
  const keyDown = (event: KeyboardEvent) => key(event, true);
  const keyUp = (event: KeyboardEvent) => key(event, false);
  const mouseMove = (event: MouseEvent) => {
    if (document.pointerLockElement !== canvas) return;
    look.current.yaw -= event.movementX * 0.0025;
    look.current.pitch -= event.movementY * 0.002;
  };
  const pointerMove = (event: PointerEvent) => {
    if (!dragging || event.pointerType === 'mouse') return;
    look.current.yaw -= (event.clientX - lastPointer.x) * 0.006;
    look.current.pitch -= (event.clientY - lastPointer.y) * 0.005;
    lastPointer = { x: event.clientX, y: event.clientY };
  };
  const pointerDown = (event: PointerEvent) => {
    onStart();
    if (event.pointerType === 'mouse') {
      if (document.pointerLockElement === canvas) onShoot();
      else void canvas.requestPointerLock();
      return;
    }
    dragging = true;
    lastPointer = { x: event.clientX, y: event.clientY };
  };
  const pointerUp = () => {
    dragging = false;
  };

  window.addEventListener('keydown', keyDown);
  window.addEventListener('keyup', keyUp);
  document.addEventListener('mousemove', mouseMove);
  canvas.addEventListener('pointerdown', pointerDown);
  canvas.addEventListener('pointermove', pointerMove);
  window.addEventListener('pointerup', pointerUp);

  return () => {
    window.removeEventListener('keydown', keyDown);
    window.removeEventListener('keyup', keyUp);
    document.removeEventListener('mousemove', mouseMove);
    canvas.removeEventListener('pointerdown', pointerDown);
    canvas.removeEventListener('pointermove', pointerMove);
    window.removeEventListener('pointerup', pointerUp);
  };
}
