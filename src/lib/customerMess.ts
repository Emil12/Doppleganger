import * as THREE from 'three';
import { CustomerModel } from './customerModel';
import { RESTROOM, SHOP, STAFF_ROOM } from './gasStationLayout';
import { markCullable } from './entityCulling';

const FLOOR_GAP = 0.006;
const INDOOR_FLOOR_HEIGHT = 0.075;
const CONCRETE_HEIGHT = -0.05;
const ROAD_HEIGHT = 0.04;
export const MAX_BLOOD_MARKS_PER_CUSTOMER = 24;

function floorHeight(position: THREE.Vector3) {
  const insideShop = position.x >= SHOP.left
    && position.x <= SHOP.right
    && position.z >= SHOP.back
    && position.z <= SHOP.front;
  const insideStaffRoom = position.x >= STAFF_ROOM.left
    && position.x <= STAFF_ROOM.right
    && position.z >= STAFF_ROOM.back
    && position.z <= STAFF_ROOM.front;
  const insideRestroom = position.x >= RESTROOM.left
    && position.x <= RESTROOM.right
    && position.z >= RESTROOM.back
    && position.z <= RESTROOM.front;
  if (insideShop || insideStaffRoom || insideRestroom) return INDOOR_FLOOR_HEIGHT;
  if (position.z >= 9 && position.z <= 19) return ROAD_HEIGHT;
  return CONCRETE_HEIGHT;
}

function blobGeometry(radius: number, points: number, salt: number) {
  const shape = new THREE.Shape();
  for (let index = 0; index < points; index += 1) {
    const angle = (index / points) * Math.PI * 2;
    const wobble = 0.72 + Math.abs(Math.sin(index * 8.31 + salt)) * 0.42;
    const x = Math.cos(angle) * radius * wobble;
    const y = Math.sin(angle) * radius * wobble;
    if (index === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return new THREE.ShapeGeometry(shape);
}

const BLOOD_BLOB_GEOMETRY = blobGeometry(1, 11, 1);
const bloodMaterials = new Map<number, THREE.MeshStandardMaterial>();

function bloodMaterial(color: number) {
  const cached = bloodMaterials.get(color);
  if (cached) return cached;
  const created = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.88,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });
  bloodMaterials.set(color, created);
  return created;
}

function stain(radius: number, color: number, x = 0, z = 0, salt = 1) {
  const mesh = new THREE.Mesh(BLOOD_BLOB_GEOMETRY, bloodMaterial(color));
  mesh.rotation.set(-Math.PI / 2, 0, salt);
  mesh.scale.setScalar(radius);
  mesh.position.set(x, FLOOR_GAP, z);
  mesh.receiveShadow = true;
  return mesh;
}

export function createCustomerSplatter(
  scene: THREE.Scene,
  position: THREE.Vector3,
  intensity = 1,
) {
  const splatter = new THREE.Group();
  splatter.name = 'customer-mess';
  splatter.position.set(position.x, floorHeight(position), position.z);
  splatter.add(stain(0.92 * intensity, 0x681018));
  splatter.add(stain(0.48 * intensity, 0x8a151b, 0.5 * intensity, -0.12, 4));
  for (let index = 0; index < Math.floor(14 * intensity); index += 1) {
    const angle = index * 2.17;
    const distance = (0.72 + (index % 5) * 0.23) * intensity;
    const radius = 0.055 + (index % 4) * 0.028;
    splatter.add(stain(
      radius,
      index % 3 === 0 ? 0x8f171c : 0x5c0c12,
      Math.cos(angle) * distance,
      Math.sin(angle) * distance,
      index,
    ));
  }
  markCullable(splatter, 2.7 * intensity, 38);
  scene.add(splatter);
  return splatter;
}

export function createBloodDrop(scene: THREE.Scene, position: THREE.Vector3) {
  const drop = new THREE.Group();
  drop.name = 'anomaly-blood-drop';
  drop.position.set(position.x, floorHeight(position), position.z);
  drop.add(stain(0.34, 0x681018, 0, 0, position.x + position.z));
  drop.add(stain(0.13, 0x9d1820, 0.3, -0.12, position.z));
  markCullable(drop, 0.8, 32);
  scene.add(drop);
  return drop;
}

export function createShotBloodPuddles(scene: THREE.Scene, position: THREE.Vector3) {
  const offsets = [
    new THREE.Vector2(-0.3, -0.14),
    new THREE.Vector2(0.12, 0.24),
    new THREE.Vector2(0.38, -0.22),
  ];
  return offsets.map(({ x, y }) => {
    const puddlePosition = position.clone();
    puddlePosition.x += x;
    puddlePosition.z += y;
    return createBloodDrop(scene, puddlePosition);
  });
}

export function animateCustomerDeath(model: CustomerModel, elapsed: number) {
  const progress = THREE.MathUtils.smoothstep(elapsed, 0, 550);
  model.root.rotation.z = -progress * Math.PI * 0.5;
  model.leftArm.rotation.x = progress * 0.8;
  model.rightArm.rotation.x = -progress * 0.65;
}
