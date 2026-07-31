alter table public.game_profiles
  add column free_play_hours integer not null default 50
  check (free_play_hours between 1 and 50000);

do $$
begin
  if (select count(*) from public.game_profiles) <> 1 then
    raise exception 'Expected exactly one owner profile; special trial grant cancelled';
  end if;

  update public.game_profiles
  set
    free_play_hours = 50000,
    updated_at = now();
end;
$$;
