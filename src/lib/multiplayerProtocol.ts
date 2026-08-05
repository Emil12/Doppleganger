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

export type ChatMessage = {
  messageId: string;
  playerId: string;
  playerName: string;
  text: string;
  sentAt: string;
};

export function validChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== 'object') return false;
  const message = value as Partial<ChatMessage>;
  return typeof message.messageId === 'string' && message.messageId.length > 0
    && typeof message.playerId === 'string' && message.playerId.length > 0
    && typeof message.playerName === 'string' && message.playerName.length > 0
    && message.playerName.length <= 24
    && typeof message.text === 'string' && message.text.trim().length > 0
    && message.text.length <= 160
    && typeof message.sentAt === 'string' && !Number.isNaN(Date.parse(message.sentAt));
}

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
