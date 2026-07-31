import { Direction } from './firstPerson';
import { handleGameKey } from './gameInput';
import { type WeaponSlot } from './weaponTypes';

type LookRef = {
  current: { yaw: number; pitch: number };
};

type SessionInputOptions = {
  canvas: HTMLCanvasElement;
  look: LookRef;
  getSensitivity: () => number;
  onControl: (direction: Direction, pressed: boolean) => void;
  onJump: () => void;
  onSprint: (pressed: boolean) => void;
  onCrouch: () => void;
  onInteract: () => void;
  onRefuse: () => void;
  onReload: () => void;
  onUseMedkit: () => void;
  onSelectSlot: (slot: WeaponSlot) => void;
  onAim: (aiming: boolean) => void;
  onShoot: () => void;
  onStart: () => void;
};

export function attachGameSessionInput({
  canvas,
  look,
  getSensitivity,
  onControl,
  onJump,
  onSprint,
  onCrouch,
  onInteract,
  onRefuse,
  onReload,
  onUseMedkit,
  onSelectSlot,
  onAim,
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
      onUseMedkit,
      onSelectSlot,
    );
  };
  const keyDown = (event: KeyboardEvent) => key(event, true);
  const keyUp = (event: KeyboardEvent) => key(event, false);
  const mouseMove = (event: MouseEvent) => {
    if (document.pointerLockElement !== canvas) return;
    const sensitivity = getSensitivity();
    look.current.yaw -= event.movementX * 0.0025 * sensitivity;
    look.current.pitch -= event.movementY * 0.002 * sensitivity;
  };
  const pointerMove = (event: PointerEvent) => {
    if (!dragging || event.pointerType === 'mouse') return;
    const sensitivity = getSensitivity();
    look.current.yaw -= (event.clientX - lastPointer.x) * 0.006 * sensitivity;
    look.current.pitch -= (event.clientY - lastPointer.y) * 0.005 * sensitivity;
    lastPointer = { x: event.clientX, y: event.clientY };
  };
  const pointerDown = (event: PointerEvent) => {
    onStart();
    if (event.pointerType === 'mouse') {
      if (document.pointerLockElement !== canvas) {
        void canvas.requestPointerLock();
      } else if (event.button === 2) {
        onAim(true);
      } else if (event.button === 0) {
        onShoot();
      }
      return;
    }
    dragging = true;
    lastPointer = { x: event.clientX, y: event.clientY };
  };
  const pointerUp = (event: PointerEvent) => {
    if (event.pointerType === 'mouse' && event.button === 2) onAim(false);
    dragging = false;
  };
  const contextMenu = (event: MouseEvent) => event.preventDefault();
  const pointerLockChange = () => {
    if (document.pointerLockElement !== canvas) onAim(false);
  };

  window.addEventListener('keydown', keyDown);
  window.addEventListener('keyup', keyUp);
  document.addEventListener('mousemove', mouseMove);
  canvas.addEventListener('pointerdown', pointerDown);
  canvas.addEventListener('pointermove', pointerMove);
  canvas.addEventListener('contextmenu', contextMenu);
  document.addEventListener('pointerlockchange', pointerLockChange);
  window.addEventListener('pointerup', pointerUp);

  return () => {
    window.removeEventListener('keydown', keyDown);
    window.removeEventListener('keyup', keyUp);
    document.removeEventListener('mousemove', mouseMove);
    canvas.removeEventListener('pointerdown', pointerDown);
    canvas.removeEventListener('pointermove', pointerMove);
    canvas.removeEventListener('contextmenu', contextMenu);
    document.removeEventListener('pointerlockchange', pointerLockChange);
    window.removeEventListener('pointerup', pointerUp);
  };
}
