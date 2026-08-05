alter table public.game_profiles
  add column molotovs integer not null default 0 check (molotovs >= 0);

create function public.buy_game_molotov()
returns table (coins integer, molotovs integer)
language plpgsql
security invoker
set search_path = public
as $$
begin
  return query
  update public.game_profiles as profile
  set coins = profile.coins - 5,
      molotovs = profile.molotovs + 1,
      updated_at = now()
  where profile.user_id = auth.uid() and profile.coins >= 5
  returning profile.coins, profile.molotovs;

  if not found then
    raise exception 'Not enough coins';
  end if;
end;
$$;

create function public.use_game_molotov()
returns table (coins integer, molotovs integer)
language plpgsql
security invoker
set search_path = public
as $$
begin
  return query
  update public.game_profiles as profile
  set molotovs = profile.molotovs - 1,
      updated_at = now()
  where profile.user_id = auth.uid() and profile.molotovs > 0
  returning profile.coins, profile.molotovs;

  if not found then
    raise exception 'No Molotovs available';
  end if;
end;
$$;

revoke all on function public.buy_game_molotov() from public;
revoke all on function public.use_game_molotov() from public;
grant execute on function public.buy_game_molotov() to authenticated;
grant execute on function public.use_game_molotov() to authenticated;
