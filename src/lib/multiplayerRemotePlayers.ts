import * as THREE from 'three';
import {
  multiplayerPlayerColor,
  remotePlayerId,
  type PresencePayload,
  type TransformPayload,
} from './multiplayerProtocol';
import { createRemotePlayerModel } from './remotePlayerModel';

export type DownedTeammate = {
  playerId: string;
  playerName: string;
};

type RemotePlayer = DownedTeammate & {
  downed: boolean;
  model: ReturnType<typeof createRemotePlayerModel>;
  moving: boolean;
  revivesUsed: number;
  target: THREE.Vector3;
  yaw: number;
};

export function createMultiplayerRemotePlayers(scene: THREE.Scene) {
  const players = new Map<string, RemotePlayer>();

  const remove = (playerId: string) => {
    players.get(playerId)?.model.dispose();
    players.delete(playerId);
  };

  const ensure = (playerId: string, playerName: string) => {
    const existing = players.get(playerId);
    if (existing) return existing;
    const model = createRemotePlayerModel(playerName, multiplayerPlayerColor(playerId));
    model.root.traverse((object) => { object.userData.multiplayerPlayerId = playerId; });
    scene.add(model.root);
    const player: RemotePlayer = {
      playerId,
      playerName,
      downed: false,
      model,
      moving: false,
      revivesUsed: 0,
      target: new THREE.Vector3(),
      yaw: 0,
    };
    players.set(playerId, player);
    return player;
  };

  const syncPresence = (presences: PresencePayload[], ownPlayerId: string) => {
    const present = new Set<string>();
    presences.forEach((presence) => {
      if (presence.playerId === ownPlayerId) return;
      present.add(presence.playerId);
      ensure(presence.playerId, presence.playerName);
    });
    players.forEach((_, playerId) => {
      if (!present.has(playerId)) remove(playerId);
    });
  };

  const applyTransform = (payload: TransformPayload) => {
    const player = ensure(payload.playerId, payload.playerName);
    player.target.set(...payload.position);
    player.yaw = payload.yaw;
    player.moving = payload.moving;
    player.downed = payload.downed;
    player.revivesUsed = payload.revivesUsed;
  };

  const update = (time: number, delta: number) => {
    players.forEach((player) => {
      player.model.root.position.lerp(player.target, Math.min(1, delta * 12));
      player.model.root.rotation.y = THREE.MathUtils.lerp(
        player.model.root.rotation.y,
        player.yaw,
        0.2,
      );
      player.model.animate(player.moving, player.downed, time);
    });
  };

  const nearbyDowned = (position: THREE.Vector3) => {
    let nearest: RemotePlayer | null = null;
    let nearestDistance = 2.2;
    for (const player of players.values()) {
      if (!player.downed || player.revivesUsed >= 3) continue;
      const distance = player.model.root.position.distanceTo(position);
      if (distance >= nearestDistance) continue;
      nearest = player;
      nearestDistance = distance;
    }
    return nearest ? { playerId: nearest.playerId, playerName: nearest.playerName } : null;
  };

  const hitPlayerIds = (objects: readonly THREE.Object3D[]) => (
    new Set(objects.map(remotePlayerId).filter((playerId) => playerId !== null))
  );

  const markRevived = (playerId: string) => {
    const player = players.get(playerId);
    if (player) player.downed = false;
  };

  const dispose = () => {
    Array.from(players.keys()).forEach(remove);
  };

  return {
    applyTransform,
    count: () => players.size,
    dispose,
    hitPlayerIds,
    markRevived,
    nearbyDowned,
    syncPresence,
    update,
  };
}
