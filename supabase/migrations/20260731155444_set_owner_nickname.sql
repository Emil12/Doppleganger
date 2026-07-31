do $$
begin
  if (select count(*) from public.game_profiles) <> 1 then
    raise exception 'Expected exactly one player profile; nickname update cancelled';
  end if;

  update public.game_profiles
  set
    display_name = 'amulka123456789',
    updated_at = now();
end;
$$;
