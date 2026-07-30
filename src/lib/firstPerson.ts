import * as THREE from 'three';
import { FOREST_TREES } from './gasStationForest';
import { PUMP_POSITIONS, SHOP, STAFF_ROOM } from './gasStationLayout';
import { SHOP_SHELF_BOUNDS } from './gasStationShelves';

export type Direction = 'up' | 'down' | 'left' | 'right';
export type Controls = Record<Direction, boolean>;
export type JumpState = { height: number; velocity: number };
export type SprintState = { stamina: number };
export type CrouchState = { amount: number };

const KEY_DIRECTIONS: Record<string, Direction> = {
  arrowup: 'up',
  w: 'up',
  arrowdown: 'down',
  s: 'down',
  arrowleft: 'left',
  a: 'left',
  arrowright: 'right',
  d: 'right',
};

type Wall = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
};

const walls: Wall[] = [
  { minX: SHOP.left - 0.25, maxX: SHOP.right + 0.25, minZ: SHOP.back - 0.25, maxZ: SHOP.back + 0.25 },
  { minX: SHOP.left - 0.25, maxX: SHOP.left + 0.25, minZ: SHOP.back, maxZ: SHOP.front },
  {
    minX: SHOP.right - 0.25,
    maxX: SHOP.right + 0.25,
    minZ: STAFF_ROOM.doorFront,
    maxZ: SHOP.front,
  },
  {
    minX: SHOP.right - 0.25,
    maxX: SHOP.right + 0.25,
    minZ: SHOP.back,
    maxZ: STAFF_ROOM.doorBack,
  },
  { minX: SHOP.left, maxX: SHOP.doorLeft, minZ: SHOP.front - 0.25, maxZ: SHOP.front + 0.25 },
  { minX: SHOP.doorRight, maxX: SHOP.right, minZ: SHOP.front - 0.25, maxZ: SHOP.front + 0.25 },
  { minX: -8.4, maxX: -7.15, minZ: -22.3, maxZ: -18.7 },
  { minX: -8.4, maxX: -7.15, minZ: -17.6, maxZ: -14 },
  { minX: 5.45, maxX: 6.9, minZ: -16.8, maxZ: -12.2 },
  ...PUMP_POSITIONS.map((x) => ({ minX: x - 0.65, maxX: x + 0.65, minZ: -5.1, maxZ: -3.5 })),
  {
    minX: STAFF_ROOM.right - 0.25,
    maxX: STAFF_ROOM.right + 0.25,
    minZ: STAFF_ROOM.back,
    maxZ: STAFF_ROOM.front,
  },
  {
    minX: STAFF_ROOM.left,
    maxX: STAFF_ROOM.right,
    minZ: STAFF_ROOM.front - 0.25,
    maxZ: STAFF_ROOM.front + 0.25,
  },
  {
    minX: STAFF_ROOM.left,
    maxX: 10.8,
    minZ: STAFF_ROOM.back - 0.25,
    maxZ: STAFF_ROOM.back + 0.25,
  },
  {
    minX: 13.2,
    maxX: STAFF_ROOM.right,
    minZ: STAFF_ROOM.back - 0.25,
    maxZ: STAFF_ROOM.back + 0.25,
  },
  {
    minX: STAFF_ROOM.left - 0.25,
    maxX: STAFF_ROOM.left + 0.25,
    minZ: STAFF_ROOM.back,
    maxZ: SHOP.back,
  },
  { minX: 9.1, maxX: 10, minZ: -26.15, maxZ: -25.25 },
  ...SHOP_SHELF_BOUNDS,
  ...FOREST_TREES.map(([x, z, scale]) => ({
    minX: x - scale * 0.32,
    maxX: x + scale * 0.32,
    minZ: z - scale * 0.32,
    maxZ: z + scale * 0.32,
  })),
];

const PLAYER_RADIUS = 0.34;
const WORLD_LIMIT = 35;

function collides(x: number, z: number) {
  if (Math.abs(x) > WORLD_LIMIT || Math.abs(z) > WORLD_LIMIT) return true;
  return walls.some(
    (wall) =>
      x + PLAYER_RADIUS > wall.minX &&
      x - PLAYER_RADIUS < wall.maxX &&
      z + PLAYER_RADIUS > wall.minZ &&
      z - PLAYER_RADIUS < wall.maxZ,
  );
}

function movePlayer(
  position: THREE.Vector3,
  xMove: number,
  zMove: number,
  extraCollision?: (x: number, z: number) => boolean,
) {
  const nextX = position.x + xMove;
  if (!collides(nextX, position.z) && !extraCollision?.(nextX, position.z)) position.x = nextX;
  const nextZ = position.z + zMove;
  if (!collides(position.x, nextZ) && !extraCollision?.(position.x, nextZ)) position.z = nextZ;
}

export function directionForKey(key: string) {
  return KEY_DIRECTIONS[key.toLowerCase()];
}

export function updatePlayer(
  camera: THREE.PerspectiveCamera,
  controls: Controls,
  yaw: number,
  jumpRequested: boolean,
  jump: JumpState,
  sprintHeld: boolean,
  sprint: SprintState,
  crouched: boolean,
  crouch: CrouchState,
  time: number,
  delta: number,
  extraCollision?: (x: number, z: number) => boolean,
) {
  const forward = Number(controls.up) - Number(controls.down);
  const side = Number(controls.right) - Number(controls.left);
  const isWalking = forward !== 0 || side !== 0;
  const isSprinting =
    !crouched && sprintHeld && controls.up && jump.height === 0 && sprint.stamina > 0;
  const recovery = isSprinting ? -14 : 18;
  sprint.stamina = THREE.MathUtils.clamp(sprint.stamina + recovery * delta, 0, 100);
  const speedBoost = isSprinting ? 1.75 : 1;
  const stanceSpeed = crouched ? 0.58 : 1;
  const speed = (delta * 4.4 * speedBoost * stanceSpeed) / (Math.hypot(forward, side) || 1);
  const xMove = (-Math.sin(yaw) * forward + Math.cos(yaw) * side) * speed;
  const zMove = (-Math.cos(yaw) * forward - Math.sin(yaw) * side) * speed;
  movePlayer(camera.position, xMove, zMove, extraCollision);
  if (jumpRequested && !crouched && jump.height === 0) jump.velocity = 5.4;
  jump.velocity -= delta * 15;
  jump.height = Math.max(0, jump.height + jump.velocity * delta);
  if (jump.height === 0) jump.velocity = 0;
  crouch.amount = THREE.MathUtils.lerp(
    crouch.amount,
    crouched ? 1 : 0,
    Math.min(1, delta * 10),
  );
  const bobAmount = crouched ? 0.018 : 0.035;
  const headBob = isWalking && jump.height === 0 ? Math.sin(time * 0.012) * bobAmount : 0;
  camera.position.y = THREE.MathUtils.lerp(1.65, 1.05, crouch.amount) + jump.height + headBob;
}

export function isInsideShop(position: THREE.Vector3) {
  const insideMainShop =
    position.x > SHOP.left &&
    position.x < SHOP.right &&
    position.z < SHOP.front &&
    position.z > SHOP.back;
  const insideStaffRoom =
    position.x > STAFF_ROOM.left &&
    position.x < STAFF_ROOM.right &&
    position.z < STAFF_ROOM.front &&
    position.z > STAFF_ROOM.back;
  return insideMainShop || insideStaffRoom;
}
