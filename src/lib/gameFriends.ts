import { supabase } from './supabase';

export type GameFriend = {
  playerId: string;
  displayName: string;
};

type FriendRow = {
  player_id: unknown;
  display_name: unknown;
};

function friendsFromRows(value: unknown): GameFriend[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const row = item as FriendRow;
    return typeof row.player_id === 'string' && typeof row.display_name === 'string'
      ? [{ playerId: row.player_id, displayName: row.display_name }]
      : [];
  });
}

export async function searchGamePlayers(query: string) {
  const normalized = query.trim().slice(0, 24);
  if (normalized.length < 2) return [];
  const { data, error } = await supabase.rpc('search_game_players', {
    search_text: normalized,
  });
  return error ? [] : friendsFromRows(data);
}

export async function loadGameFriends() {
  const { data, error } = await supabase.rpc('list_game_friends');
  return error ? [] : friendsFromRows(data);
}

export async function addGameFriend(friendId: string) {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return false;
  const { error } = await supabase.from('game_friends').upsert({
    user_id: data.user.id,
    friend_id: friendId,
  });
  return !error;
}
