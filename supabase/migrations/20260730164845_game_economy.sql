create table public.game_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  coins integer not null default 0 check (coins >= 0),
  medkits integer not null default 0 check (medkits >= 0),
  updated_at timestamptz not null default now()
);

alter table public.game_profiles enable row level security;

create policy "read own game profile"
  on public.game_profiles for select
  using (auth.uid() = user_id);

create policy "insert own game profile"
  on public.game_profiles for insert
  with check (auth.uid() = user_id);

create policy "update own game profile"
  on public.game_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create function public.add_game_coins(amount integer)
returns table (coins integer, medkits integer)
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is null or amount <= 0 then
    raise exception 'Invalid coin reward';
  end if;

  return query
  insert into public.game_profiles as profile (user_id, coins)
  values (auth.uid(), amount)
  on conflict (user_id) do update
    set coins = profile.coins + excluded.coins,
        updated_at = now()
  returning profile.coins, profile.medkits;
end;
$$;

create function public.buy_game_medkit()
returns table (coins integer, medkits integer)
language plpgsql
security invoker
set search_path = public
as $$
begin
  return query
  update public.game_profiles as profile
  set coins = profile.coins - 5,
      medkits = profile.medkits + 1,
      updated_at = now()
  where profile.user_id = auth.uid() and profile.coins >= 5
  returning profile.coins, profile.medkits;

  if not found then
    raise exception 'Not enough coins';
  end if;
end;
$$;

create function public.use_game_medkit()
returns table (coins integer, medkits integer)
language plpgsql
security invoker
set search_path = public
as $$
begin
  return query
  update public.game_profiles as profile
  set medkits = profile.medkits - 1,
      updated_at = now()
  where profile.user_id = auth.uid() and profile.medkits > 0
  returning profile.coins, profile.medkits;

  if not found then
    raise exception 'No medkits available';
  end if;
end;
$$;

revoke all on function public.add_game_coins(integer) from public;
revoke all on function public.buy_game_medkit() from public;
revoke all on function public.use_game_medkit() from public;
grant execute on function public.add_game_coins(integer) to authenticated;
grant execute on function public.buy_game_medkit() to authenticated;
grant execute on function public.use_game_medkit() to authenticated;
