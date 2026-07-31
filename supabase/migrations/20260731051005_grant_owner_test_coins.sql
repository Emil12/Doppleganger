do $$
begin
  if (select count(*) from public.game_profiles) <> 1 then
    raise exception 'Expected exactly one game profile; test coin grant cancelled';
  end if;

  update public.game_profiles
  set
    coins = coins + 2500,
    owned_classes = array[
      'attendant',
      'guard',
      'rifleman',
      'medic',
      'retired_hunter'
    ]::text[];
end;
$$;
