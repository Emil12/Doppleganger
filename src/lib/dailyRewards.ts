import { isSupabaseConfigured, supabase } from './supabase';

export const DAILY_REWARD_DAYS = 60;
export const POLICEMAN_REFUND_COINS = 35;

export type DailyRewardState = {
  claimedDays: number;
  lastClaimedOn: string | null;
};

export const EMPTY_DAILY_REWARD_STATE: DailyRewardState = {
  claimedDays: 0,
  lastClaimedOn: null,
};

type DailyRewardRow = {
  claimed_days: number;
  last_claimed_on: string | null;
};

export function dailyRewardAmount(day: number) {
  if (day === DAILY_REWARD_DAYS) return 125;
  return 5 + Math.floor((day - 1) / 7);
}

export function isRewardAvailable(state: DailyRewardState) {
  const todayUtc = new Date().toISOString().slice(0, 10);
  return state.claimedDays < DAILY_REWARD_DAYS && state.lastClaimedOn !== todayUtc;
}

export async function loadDailyRewardState(): Promise<DailyRewardState> {
  if (!isSupabaseConfigured) return EMPTY_DAILY_REWARD_STATE;
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return EMPTY_DAILY_REWARD_STATE;
  const { data } = await supabase
    .from('daily_reward_progress')
    .select('claimed_days, last_claimed_on')
    .eq('user_id', userData.user.id)
    .maybeSingle();
  if (!data) return EMPTY_DAILY_REWARD_STATE;
  const row = data as DailyRewardRow;
  return {
    claimedDays: row.claimed_days,
    lastClaimedOn: row.last_claimed_on,
  };
}

export async function claimDailyReward() {
  const { error } = await supabase.rpc('claim_daily_reward');
  return !error;
}
