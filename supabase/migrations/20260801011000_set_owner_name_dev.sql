do $$
begin
  if (
    select count(*)
    from public.game_profiles
    where free_play_hours = 50000
  ) <> 1 then
    raise exception 'Expected exactly one owner profile; nickname update cancelled';
  end if;

  update public.game_profiles
  set display_name = 'DEV OF THE GAME',
      updated_at = now()
  where free_play_hours = 50000;
end;
$$;
