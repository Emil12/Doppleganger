import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import {
  DAILY_REWARD_DAYS,
  dailyRewardAmount,
  EMPTY_DAILY_REWARD_STATE,
  isRewardAvailable,
  loadDailyRewardState,
  POLICEMAN_REFUND_COINS,
} from '../lib/dailyRewards';
import './MainMenuDailyRewards.css';

type MainMenuDailyRewardsProps = {
  signedIn: boolean;
  busy: boolean;
  hasPoliceman: boolean;
  onClaim: () => Promise<boolean>;
  onBack: () => void;
};

export function MainMenuDailyRewards(props: MainMenuDailyRewardsProps) {
  const [state, setState] = useState(EMPTY_DAILY_REWARD_STATE);
  const [month, setMonth] = useState(0);
  const [loading, setLoading] = useState(props.signedIn);

  useEffect(() => {
    let active = true;
    void loadDailyRewardState().then((nextState) => {
      if (!active) return;
      setState(nextState);
      setMonth(Math.min(1, Math.floor(nextState.claimedDays / 30)));
      setLoading(false);
    });
    return () => { active = false; };
  }, [props.signedIn]);

  const claim = async () => {
    if (!await props.onClaim()) return;
    const nextState = await loadDailyRewardState();
    setState(nextState);
    setMonth(Math.min(1, Math.floor(nextState.claimedDays / 30)));
  };

  const startDay = month * 30 + 1;
  const days = Array.from({ length: 30 }, (_, index) => startDay + index);
  const available = props.signedIn && isRewardAvailable(state);
  const finished = state.claimedDays >= DAILY_REWARD_DAYS;
  const nextDay = state.claimedDays + 1;
  const isFinalReward = nextDay === DAILY_REWARD_DAYS;
  const finalRewardText = props.hasPoliceman
    ? `${125 + POLICEMAN_REFUND_COINS} COINS · INCLUDES ${POLICEMAN_REFUND_COINS} REFUND`
    : '125 COINS + POLICEMAN CLASS';

  return (
    <div className="daily-rewards">
      <header>
        <div><strong>DAILY REWARDS</strong><small>60-DAY LOGIN PROGRAM</small></div>
        <span>{state.claimedDays} / {DAILY_REWARD_DAYS}</span>
      </header>
      <div className="daily-rewards__months" aria-label="Reward months">
        {[0, 1].map((monthIndex) => (
          <button
            className={month === monthIndex ? 'is-selected' : ''}
            key={monthIndex}
            type="button"
            onClick={() => setMonth(monthIndex)}
          >
            MONTH {monthIndex + 1}
          </button>
        ))}
      </div>
      <div className="daily-rewards__grid">
        {days.map((day) => {
          const claimed = day <= state.claimedDays;
          const next = day === state.claimedDays + 1;
          return (
            <div className={`${claimed ? 'is-claimed' : ''} ${next ? 'is-next' : ''}`} key={day}>
              <small>DAY {day}</small>
              <strong>{claimed ? '✓' : day === DAILY_REWARD_DAYS
                ? '◉ 125 + P'
                : `◉ ${dailyRewardAmount(day)}`}</strong>
            </div>
          );
        })}
      </div>
      {!props.signedIn ? (
        <div className="daily-rewards__signin">
          <span>SIGN IN TO START COLLECTING REWARDS.</span>
          <Link href="/auth">SIGN IN</Link>
        </div>
      ) : (
        <button
          className="daily-rewards__claim"
          type="button"
          disabled={loading || props.busy || !available}
          onClick={() => { void claim(); }}
        >
          {finished ? 'ALL 60 REWARDS CLAIMED' : available
            ? `CLAIM DAY ${nextDay} · ${isFinalReward ? finalRewardText : `${dailyRewardAmount(nextDay)} COINS`}`
            : 'COME BACK TOMORROW'}
        </button>
      )}
      <button type="button" onClick={props.onBack}>BACK</button>
    </div>
  );
}
