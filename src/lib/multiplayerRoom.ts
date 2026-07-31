import { supabase } from './supabase';

export type MultiplayerRoomSession = {
  code: string;
  playerId: string;
  playerName: string;
};

const ROOM_CODE_LENGTH = 6;
const ROOM_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function normalizeRoomCode(value: string) {
  return value.toUpperCase().replace(/[^A-Z2-9]/g, '').slice(0, ROOM_CODE_LENGTH);
}

export function createRoomCode() {
  const random = new Uint32Array(ROOM_CODE_LENGTH);
  crypto.getRandomValues(random);
  return Array.from(random, (value) => ROOM_ALPHABET[value % ROOM_ALPHABET.length]).join('');
}

export async function createMultiplayerSession(code: string) {
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  const roomCode = normalizeRoomCode(code);
  if (!user || roomCode.length !== ROOM_CODE_LENGTH) return null;
  const fallbackName = `PLAYER-${user.id.slice(0, 4).toUpperCase()}`;
  const emailName = user.email?.split('@')[0].trim().slice(0, 16);
  return {
    code: roomCode,
    playerId: user.id,
    playerName: emailName || fallbackName,
  } satisfies MultiplayerRoomSession;
}
