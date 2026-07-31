import { isSupabaseConfigured, supabase } from './supabase';
import {
  isPlayerClassKind,
  type PlayerClassKind,
} from './playerClasses';

export type GameEconomy = {
  coins: number;
  medkits: number;
  signedIn: boolean;
  selectedClass: PlayerClassKind;
  ownedClasses: PlayerClassKind[];
  freePlayHours: number;
};

type EconomyRow = {
  coins: number;
  medkits: number;
  selected_class: unknown;
  owned_classes: unknown;
  free_play_hours: number;
};

export const EMPTY_GAME_ECONOMY: GameEconomy = {
  coins: 0,
  medkits: 0,
  signedIn: false,
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
    selectedClass,
    ownedClasses,
    freePlayHours: Number.isFinite(row.free_play_hours) ? row.free_play_hours : 50,
  };
}

export async function loadGameEconomy(): Promise<GameEconomy> {
  if (!isSupabaseConfigured) return EMPTY_GAME_ECONOMY;
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return EMPTY_GAME_ECONOMY;

  await supabase
    .from('game_profiles')
    .upsert({ user_id: userData.user.id }, { onConflict: 'user_id', ignoreDuplicates: true });
  const { data, error } = await supabase
    .from('game_profiles')
    .select('coins, medkits, selected_class, owned_classes, free_play_hours')
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
