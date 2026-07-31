import * as THREE from 'three';
import { addAtmosphere } from './gasStationAtmosphere';
import { addCheckoutStation } from './gasStationCheckout';
import { addGasStationDecor } from './gasStationDecor';
import { addFreezers } from './gasStationFreezers';
import { addGasStationForest } from './gasStationForest';
import { PUMP_POSITIONS, RESTROOM, SHOP } from './gasStationLayout';
import { addStationLighting } from './gasStationLighting';
import { addStaffRoom } from './gasStationStaffRoom';
import { addRestroom } from './gasStationRestroom';
import { addShopShelves } from './gasStationShelves';
import { addDetailedModels } from './gasStationModels';
import { addPolygonDetails } from './gasStationPolygons';
import { PixelTexture, pixelMaterial } from './pixelTextures';
import { addWallMedkit } from './wallMedkit';
import { addCounterRadio } from './counterRadioModel';
import { FUEL_PUMP_NAME_PREFIX } from './fuelPumpSystem';

type Size = [number, number, number];
type Position = [number, number, number];

function box(
  parent: THREE.Object3D,
  color: number,
  size: Size,
  position: Position,
  emissive = 0x000000,
  texture?: PixelTexture,
  repeat: [number, number] = [1, 1],
) {
  const geometry = new THREE.BoxGeometry(...size);
  const material = texture
    ? pixelMaterial(texture, ...repeat, color)
    : new THREE.MeshStandardMaterial({
        color,
        emissive,
        flatShading: true,
        roughness: emissive ? 0.38 : 0.72,
        metalness: 0.06,
      });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.castShadow = size[1] >= 0.25;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function sign(
  scene: THREE.Scene,
  text: string,
  position: Position,
  width: number,
  background = '#31583d',
  rotationY = 0,
) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 96;
  const context = canvas.getContext('2d');
  if (!context) return;
  context.fillStyle = background;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = '#dbd5b7';
  context.lineWidth = 8;
  context.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
  context.fillStyle = '#eee5c6';
  context.font = 'bold 34px monospace';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, 128, 50);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.DoubleSide,
  });
  const signboard = new THREE.Mesh(
    new THREE.PlaneGeometry(width, width * 0.375),
    material,
  );
  signboard.position.set(...position);
  signboard.rotation.y = rotationY;
  scene.add(signboard);
}

function buildShop(scene: THREE.Scene) {
  box(scene, 0xffffff, [17, 0.15, 14], [0, 0, -16.5], 0, 'tile', [8, 7]);
  box(scene, 0x7a8179, [18, 0.5, 15], [0, 4.25, -16.5], 0, 'metal', [10, 7]);
  const backLeft = SHOP.left - 0.25;
  const backRight = SHOP.right + 0.25;
  const leftWallWidth = RESTROOM.doorLeft - backLeft;
  const rightWallWidth = backRight - RESTROOM.doorRight;
  box(scene, 0xffffff, [leftWallWidth, 4, 0.5], [(backLeft + RESTROOM.doorLeft) / 2, 2, SHOP.back], 0, 'wall', [2, 2]);
  box(scene, 0xffffff, [rightWallWidth, 4, 0.5], [(RESTROOM.doorRight + backRight) / 2, 2, SHOP.back], 0, 'wall', [7, 2]);
  box(scene, 0xffffff, [RESTROOM.doorRight - RESTROOM.doorLeft, 1, 0.5], [(RESTROOM.doorLeft + RESTROOM.doorRight) / 2, 3.5, SHOP.back], 0, 'wall');
  box(scene, 0xffffff, [0.5, 4, 14.5], [-8.5, 2, -16.5], 0, 'wall', [7, 2]);
  box(scene, 0xffffff, [7.05, 0.9, 0.5], [-4.975, 0.45, -9.5], 0, 'wall', [4, 1]);
  box(scene, 0xffffff, [7.05, 0.9, 0.5], [4.975, 0.45, -9.5], 0, 'wall', [4, 1]);
  box(scene, 0xffffff, [7.05, 1, 0.5], [-4.975, 3.5, -9.5], 0, 'wall', [4, 1]);
  box(scene, 0xffffff, [7.05, 1, 0.5], [4.975, 3.5, -9.5], 0, 'wall', [4, 1]);

  box(scene, 0x75a864, [0.18, 3.1, 0.18], [-1.45, 1.55, -9.2], 0x18351d);
  box(scene, 0x75a864, [0.18, 3.1, 0.18], [1.45, 1.55, -9.2], 0x18351d);
  box(scene, 0x75a864, [3.05, 0.18, 0.18], [0, 3.05, -9.2], 0x18351d);
  sign(scene, 'OPEN', [0, 2.45, -9.15], 1.65, '#3d794a');

  addCheckoutStation(scene);
  sign(scene, 'CASH ONLY', [8.18, 2.9, -17.4], 2, '#31583d', -Math.PI / 2);

  for (const x of [-6.5, -2.2, 2.2, 6.5]) {
    box(scene, 0xe8d99d, [0.25, 0.08, 1.5], [x, 3.9, -16.5], 0x9b7734);
  }
}

function buildForecourt(scene: THREE.Scene) {
  box(scene, 0xb4aa8d, [22, 0.3, 6], [0, 4.6, -4], 0, 'metal', [12, 3]);
  for (const x of [-10.2, 10.2]) {
    box(scene, 0xb5ad91, [0.35, 4.5, 0.35], [x, 2.25, -4], 0, 'metal', [1, 3]);
  }

  PUMP_POSITIONS.forEach((x, index) => {
    const pump = new THREE.Group();
    pump.name = `${FUEL_PUMP_NAME_PREFIX}${index}`;
    pump.position.set(x, 0, -4.3);
    box(pump, 0xd7cba4, [1, 1.7, 1.25], [0, 0.85, 0]);
    box(pump, 0x294d37, [0.68, 0.52, 0.08], [0, 1.15, 0.66], 0x102b18);
    box(pump, 0x222522, [0.2, 0.9, 0.2], [0.65, 0.8, 0]);
    scene.add(pump);
  });

  box(scene, 0xb2a45e, [0.35, 6, 0.35], [12, 3, -8], 0, 'metal', [1, 4]);
  sign(scene, 'GAS STATION', [12, 6.3, -8], 4.4);
}

export function buildGasStationScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x101713);
  scene.fog = new THREE.FogExp2(0x101713, 0.022);
  scene.add(new THREE.HemisphereLight(0x75958c, 0x171a17, 0.65));
  const light = new THREE.DirectionalLight(0xb8d4d0, 1.1);
  light.position.set(-12, 18, 9);
  light.castShadow = true;
  light.shadow.mapSize.set(512, 512);
  light.shadow.camera.left = -24;
  light.shadow.camera.right = 24;
  light.shadow.camera.top = 24;
  light.shadow.camera.bottom = -24;
  light.shadow.bias = -0.0004;
  light.shadow.normalBias = 0.025;
  scene.add(light);

  box(scene, 0xffffff, [80, 0.2, 80], [0, -0.15, -5], 0, 'concrete', [18, 18]);
  box(scene, 0xffffff, [80, 0.08, 10], [0, 0, 14], 0, 'asphalt', [18, 3]);
  for (let x = -36; x < 38; x += 8) box(scene, 0xb0a151, [4, 0.04, 0.25], [x, 0.06, 14]);
  buildShop(scene);
  addStaffRoom(scene);
  addRestroom(scene);
  buildForecourt(scene);
  addGasStationDecor(scene);
  addGasStationForest(scene);
  addFreezers(scene);
  addShopShelves(scene);
  addDetailedModels(scene);
  addPolygonDetails(scene);
  addStationLighting(scene);
  addWallMedkit(scene);
  addCounterRadio(scene);
  addAtmosphere(scene);
  return scene;
}
