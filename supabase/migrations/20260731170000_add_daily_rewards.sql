create table public.daily_reward_progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  claimed_days integer not null default 0 check (claimed_days between 0 and 60),
  last_claimed_on date,
  updated_at timestamptz not null default now()
);

alter table public.daily_reward_progress enable row level security;

create policy "read own daily reward progress"
  on public.daily_reward_progress for select
  using (auth.uid() = user_id);

create function public.claim_daily_reward()
returns table (claimed_day integer, reward_amount integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  progress public.daily_reward_progress%rowtype;
  next_day integer;
  reward integer;
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
    when next_day = 60 then 20
    when next_day % 30 = 0 then 10
    when next_day % 7 = 0 then 5
    else 1
  end;

  update public.daily_reward_progress
  set claimed_days = next_day,
      last_claimed_on = current_date,
      updated_at = now()
  where user_id = auth.uid();

  insert into public.game_profiles as profile (user_id, coins)
  values (auth.uid(), reward)
  on conflict (user_id) do update
    set coins = profile.coins + excluded.coins,
        updated_at = now();

  return query select next_day, reward;
end;
$$;

revoke all on function public.claim_daily_reward() from public;
grant execute on function public.claim_daily_reward() to authenticated;
