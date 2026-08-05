alter table public.game_profiles
  add column grenades integer not null default 0 check (grenades >= 0);

create function public.buy_game_grenade()
returns table (coins integer, medkits integer, grenades integer)
language plpgsql
security invoker
set search_path = public
as $$
begin
  return query
  update public.game_profiles as profile
  set coins = profile.coins - 10,
      grenades = profile.grenades + 1,
      updated_at = now()
  where profile.user_id = auth.uid() and profile.coins >= 10
  returning profile.coins, profile.medkits, profile.grenades;

  if not found then
    raise exception 'Not enough coins';
  end if;
end;
$$;

create function public.use_game_grenade()
returns table (coins integer, medkits integer, grenades integer)
language plpgsql
security invoker
set search_path = public
as $$
begin
  return query
  update public.game_profiles as profile
  set grenades = profile.grenades - 1,
      updated_at = now()
  where profile.user_id = auth.uid() and profile.grenades > 0
  returning profile.coins, profile.medkits, profile.grenades;

  if not found then
    raise exception 'No grenades available';
  end if;
end;
$$;

revoke all on function public.buy_game_grenade() from public;
revoke all on function public.use_game_grenade() from public;
grant execute on function public.buy_game_grenade() to authenticated;
grant execute on function public.use_game_grenade() to authenticated;
