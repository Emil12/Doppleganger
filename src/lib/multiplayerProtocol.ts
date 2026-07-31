import * as THREE from 'three';

export type PresencePayload = {
  playerId: string;
  playerName: string;
  onlineAt: string;
};

export type MultiplayerLocalState = {
  downed: boolean;
  health: number;
  revivesUsed: number;
};

export type TransformPayload = MultiplayerLocalState & {
  playerId: string;
  playerName: string;
  position: [number, number, number];
  yaw: number;
  moving: boolean;
};

export type TeamDamagePayload = {
  attackerId: string;
  targetId: string;
};

export type TeamRevivePayload = {
  reviverId: string;
  targetId: string;
};

export function validTransform(value: TransformPayload) {
  return value.playerId.length > 0
    && value.position.length === 3
    && value.position.every(Number.isFinite)
    && Number.isFinite(value.yaw)
    && Number.isFinite(value.health)
    && Number.isFinite(value.revivesUsed);
}

export function remotePlayerId(object: THREE.Object3D) {
  let current: THREE.Object3D | null = object;
  while (current) {
    const playerId = current.userData.multiplayerPlayerId;
    if (typeof playerId === 'string') return playerId;
    current = current.parent;
  }
  return null;
}

export function multiplayerPlayerColor(id: string) {
  let hash = 0;
  for (const character of id) hash = (hash * 31 + character.charCodeAt(0)) | 0;
  return new THREE.Color().setHSL(Math.abs(hash % 360) / 360, 0.35, 0.34).getHex();
}
