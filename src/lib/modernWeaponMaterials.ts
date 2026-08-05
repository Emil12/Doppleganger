import * as THREE from 'three';

export const gunMetal = new THREE.MeshStandardMaterial({
  color: 0x1b211f,
  metalness: 0.88,
  roughness: 0.3,
});

export const edgeSteel = new THREE.MeshStandardMaterial({
  color: 0x59615e,
  metalness: 0.96,
  roughness: 0.22,
});

export const polymer = new THREE.MeshStandardMaterial({
  color: 0x282e2a,
  roughness: 0.76,
});

export const gripPolymer = new THREE.MeshStandardMaterial({
  color: 0x151917,
  roughness: 0.9,
});

export const weaponWood = new THREE.MeshStandardMaterial({
  color: 0x784629,
  roughness: 0.52,
});
