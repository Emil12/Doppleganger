create or replace function public.claim_daily_reward()
returns table (claimed_day integer, reward_amount integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  progress public.daily_reward_progress%rowtype;
  next_day integer;
  reward integer;
  owns_policeman boolean;
begin
  if auth.uid() is null then
    raise exception 'Sign in required';
  end if;

  insert into public.daily_reward_progress (user_id)
  values (auth.uid())
  on conflict (user_id) do nothing;

  select * into progress
  from public.daily_reward_progress
  where user_id = auth.uid()
  for update;

  if progress.last_claimed_on = current_date then
    raise exception 'Reward already claimed today';
  end if;
  if progress.claimed_days >= 60 then
    raise exception 'All rewards claimed';
  end if;

  next_day := progress.claimed_days + 1;
  reward := case
    when next_day = 60 then 125
    else 5 + ((next_day - 1) / 7)
  end;

  insert into public.game_profiles (user_id)
  values (auth.uid())
  on conflict (user_id) do nothing;

  if next_day = 60 then
    select 'policeman' = any(profile.owned_classes)
    into owns_policeman
    from public.game_profiles as profile
    where profile.user_id = auth.uid()
    for update;

    if owns_policeman then
      reward := reward + 35;
    else
      update public.game_profiles as profile
      set owned_classes = array_append(profile.owned_classes, 'policeman'),
          updated_at = now()
      where profile.user_id = auth.uid();
    end if;
  end if;

  update public.daily_reward_progress
  set claimed_days = next_day,
      last_claimed_on = current_date,
      updated_at = now()
  where user_id = auth.uid();

  update public.game_profiles as profile
  set coins = profile.coins + reward,
      updated_at = now()
  where profile.user_id = auth.uid();

  return query select next_day, reward;
end;
$$;

revoke all on function public.claim_daily_reward() from public;
grant execute on function public.claim_daily_reward() to authenticated;
