import { Direction, directionForKey } from './firstPerson';

export function handleGameKey(
  event: KeyboardEvent,
  pressed: boolean,
  onControl: (direction: Direction, pressed: boolean) => void,
  onJump: () => void,
  onSprint: (pressed: boolean) => void,
  onCrouch: () => void,
  onInteract: () => void,
  onRefuse: () => void,
  onReload: () => void,
  onUseMedkit: () => void,
  onSelectSlot: (slot: 1) => void,
) {
  if (event.code === 'Digit1' || event.code === 'Numpad1') {
    event.preventDefault();
    if (pressed && !event.repeat) onSelectSlot(1);
    return;
  }
  if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
    event.preventDefault();
    onSprint(pressed);
    return;
  }
  if (event.code === 'Space') {
    event.preventDefault();
    if (pressed && !event.repeat) onJump();
    return;
  }
  if (event.code === 'KeyC') {
    event.preventDefault();
    if (pressed && !event.repeat) onCrouch();
    return;
  }
  if (event.code === 'KeyE') {
    event.preventDefault();
    if (pressed && !event.repeat) onInteract();
    return;
  }
  if (event.code === 'KeyR') {
    event.preventDefault();
    if (pressed && !event.repeat) onReload();
    return;
  }
  if (event.code === 'KeyH') {
    event.preventDefault();
    if (pressed && !event.repeat) onUseMedkit();
    return;
  }
  if (event.code === 'KeyF') {
    event.preventDefault();
    if (pressed && !event.repeat) onRefuse();
    return;
  }
  const direction = directionForKey(event.key);
  if (!direction) return;
  event.preventDefault();
  onControl(direction, pressed);
}
