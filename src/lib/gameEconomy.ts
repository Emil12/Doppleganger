import { isSupabaseConfigured, supabase } from './supabase';
import {
  isPlayerClassKind,
  type PlayerClassKind,
} from './playerClasses';

export type GameEconomy = {
  coins: number;
  medkits: number;
  signedIn: boolean;
  displayName: string;
  selectedClass: PlayerClassKind;
  ownedClasses: PlayerClassKind[];
  freePlayHours: number;
};

type EconomyRow = {
  coins: number;
  medkits: number;
  display_name: unknown;
  selected_class: unknown;
  owned_classes: unknown;
  free_play_hours: number;
};

export const EMPTY_GAME_ECONOMY: GameEconomy = {
  coins: 0,
  medkits: 0,
  signedIn: false,
  displayName: 'GUEST',
  selectedClass: 'attendant',
  ownedClasses: ['attendant'],
  freePlayHours: 50,
};

function economyFromRow(row: EconomyRow): GameEconomy {
  const ownedClasses: PlayerClassKind[] = Array.isArray(row.owned_classes)
    ? row.owned_classes.filter(isPlayerClassKind)
    : ['attendant'];
  const selectedClass = isPlayerClassKind(row.selected_class)
    ? row.selected_class
    : 'attendant';
  return {
    coins: row.coins,
    medkits: row.medkits,
    signedIn: true,
    displayName: typeof row.display_name === 'string' ? row.display_name : 'PLAYER',
    selectedClass,
    ownedClasses,
    freePlayHours: Number.isFinite(row.free_play_hours) ? row.free_play_hours : 50,
  };
}

export async function loadGameEconomy(): Promise<GameEconomy> {
  if (!isSupabaseConfigured) return EMPTY_GAME_ECONOMY;
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return EMPTY_GAME_ECONOMY;

  const metadataName = userData.user.user_metadata.full_name;
  const emailName = userData.user.email?.split('@')[0];
  const preferredName = String(metadataName || emailName || '').trim();
  const displayName = (preferredName.length >= 2
    ? preferredName
    : `PLAYER-${userData.user.id.slice(0, 4)}`)
    .trim()
    .slice(0, 24)
    .toUpperCase();
  await supabase
    .from('game_profiles')
    .upsert(
      { user_id: userData.user.id, display_name: displayName },
      { onConflict: 'user_id', ignoreDuplicates: true },
    );
  const { data, error } = await supabase
    .from('game_profiles')
    .select('coins, medkits, display_name, selected_class, owned_classes, free_play_hours')
    .eq('user_id', userData.user.id)
    .single();
  if (error || !data) return { ...EMPTY_GAME_ECONOMY, signedIn: true };
  return economyFromRow(data as EconomyRow);
}

async function runEconomyAction(
  name: 'add_game_coins' | 'buy_game_medkit' | 'use_game_medkit',
  args?: { amount: number },
) {
  const { data, error } = await supabase.rpc(name, args);
  if (error || !Array.isArray(data) || !data[0]) return null;
  return loadGameEconomy();
}

export function addGameCoins(amount: number) {
  return runEconomyAction('add_game_coins', { amount });
}

export function buyGameMedkit() {
  return runEconomyAction('buy_game_medkit');
}

export function useGameMedkit() {
  return runEconomyAction('use_game_medkit');
}

async function runClassAction(
  name: 'buy_game_class' | 'select_game_class',
  playerClass: PlayerClassKind,
) {
  const { error } = await supabase.rpc(name, { class_name: playerClass });
  if (error) return null;
  return loadGameEconomy();
}

export function buyGameClass(playerClass: PlayerClassKind) {
  return runClassAction('buy_game_class', playerClass);
}

export function selectGameClass(playerClass: PlayerClassKind) {
  return runClassAction('select_game_class', playerClass);
}

export async function updateGameDisplayName(displayName: string) {
  const cleanedName = displayName.trim().replace(/\s+/g, ' ');
  if (cleanedName.length < 2 || cleanedName.length > 24) return null;
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;
  const { error } = await supabase
    .from('game_profiles')
    .update({ display_name: cleanedName, updated_at: new Date().toISOString() })
    .eq('user_id', userData.user.id);
  if (error) return null;
  return loadGameEconomy();
}
