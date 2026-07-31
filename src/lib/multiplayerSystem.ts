import * as THREE from 'three';
import { type RealtimeChannel } from '@supabase/supabase-js';
import {
  type MultiplayerLocalState,
  type PresencePayload,
  type TeamDamagePayload,
  type TeamRevivePayload,
  type TransformPayload,
  validTransform,
} from './multiplayerProtocol';
import { createMultiplayerRemotePlayers } from './multiplayerRemotePlayers';
import { type MultiplayerRoomSession } from './multiplayerRoom';
import { supabase } from './supabase';

export type MultiplayerConnection = 'connecting' | 'connected' | 'error';

type MultiplayerSystemOptions = {
  onDamage: (damage: number) => void;
  onRevive: () => void;
  showStatus: (status: MultiplayerConnection, playerCount: number) => void;
};

export function createMultiplayerSystem(scene: THREE.Scene, options: MultiplayerSystemOptions) {
  const players = createMultiplayerRemotePlayers(scene);
  let channel: RealtimeChannel | null = null;
  let session: MultiplayerRoomSession | null = null;
  let status: MultiplayerConnection = 'connecting';
  let lastBroadcastAt = 0;
  const previousPosition = new THREE.Vector3();

  const showStatus = () => options.showStatus(status, Math.min(4, players.count() + 1));

  const syncPresence = () => {
    if (!channel || !session) return;
    const presences = Object.values(channel.presenceState<PresencePayload>()).flat();
    players.syncPresence(presences, session.playerId);
    showStatus();
  };

  const disconnect = () => {
    if (channel) {
      void channel.untrack();
      void supabase.removeChannel(channel);
    }
    channel = null;
    session = null;
    players.dispose();
  };

  const connect = (nextSession: MultiplayerRoomSession) => {
    disconnect();
    session = nextSession;
    status = 'connecting';
    showStatus();
    channel = supabase.channel(`coop:${nextSession.code}`, {
      config: {
        broadcast: { self: false },
        presence: { key: nextSession.playerId, enabled: true },
      },
    });
    channel
      .on('presence', { event: 'sync' }, syncPresence)
      .on<TransformPayload>('broadcast', { event: 'player-transform' }, ({ payload }) => {
        if (!session || payload.playerId === session.playerId || !validTransform(payload)) return;
        players.applyTransform(payload);
      })
      .on<TeamDamagePayload>('broadcast', { event: 'team-damage' }, ({ payload }) => {
        if (payload.targetId === session?.playerId) options.onDamage(50);
      })
      .on<TeamRevivePayload>('broadcast', { event: 'team-revive' }, ({ payload }) => {
        if (payload.targetId === session?.playerId) options.onRevive();
      })
      .subscribe((nextStatus) => {
        if (!channel || !session) return;
        if (nextStatus === 'SUBSCRIBED') {
          status = 'connected';
          void channel.track({
            playerId: session.playerId,
            playerName: session.playerName,
            onlineAt: new Date().toISOString(),
          } satisfies PresencePayload);
        } else if (nextStatus === 'CHANNEL_ERROR' || nextStatus === 'TIMED_OUT') {
          status = 'error';
        }
        showStatus();
      });
  };

  const hit = (objects: readonly THREE.Object3D[]) => {
    if (!channel || !session || status !== 'connected') return;
    players.hitPlayerIds(objects).forEach((targetId) => {
      void channel?.send({
        type: 'broadcast',
        event: 'team-damage',
        payload: { attackerId: session?.playerId ?? '', targetId } satisfies TeamDamagePayload,
      });
    });
  };

  const revive = (targetId: string) => {
    if (!channel || !session || status !== 'connected') return false;
    players.markRevived(targetId);
    void channel.send({
      type: 'broadcast',
      event: 'team-revive',
      payload: { reviverId: session.playerId, targetId } satisfies TeamRevivePayload,
    });
    return true;
  };

  const update = (
    camera: THREE.Camera,
    yaw: number,
    time: number,
    delta: number,
    localState: MultiplayerLocalState,
  ) => {
    players.update(time, delta);
    if (!channel || !session || status !== 'connected' || time - lastBroadcastAt < 50) return;
    const position: [number, number, number] = [
      camera.position.x,
      Math.max(0, camera.position.y - 1.65),
      camera.position.z,
    ];
    const moving = !localState.downed && previousPosition.distanceTo(camera.position) > 0.008;
    previousPosition.copy(camera.position);
    lastBroadcastAt = time;
    void channel.send({
      type: 'broadcast',
      event: 'player-transform',
      payload: {
        playerId: session.playerId,
        playerName: session.playerName,
        position,
        yaw,
        moving,
        ...localState,
      } satisfies TransformPayload,
    });
  };

  return {
    connect,
    disconnect,
    dispose: disconnect,
    hit,
    nearbyDowned: players.nearbyDowned,
    revive,
    update,
  };
}
