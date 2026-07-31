alter table public.game_profiles
  drop constraint game_profiles_selected_class_check;

alter table public.game_profiles
  add constraint game_profiles_selected_class_check
    check (
      selected_class in (
        'attendant',
        'guard',
        'rifleman',
        'medic',
        'retired_hunter',
        'soldier',
        'policeman',
        'flamer'
      )
    );

create or replace function public.buy_game_class(class_name text)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  class_cost integer;
begin
  class_cost := case class_name
    when 'guard' then 10
    when 'rifleman' then 25
    when 'medic' then 35
    when 'retired_hunter' then 45
    when 'policeman' then 35
    when 'soldier' then 150
    when 'flamer' then 250
    else null
  end;

  if auth.uid() is null or class_cost is null then
    raise exception 'Invalid class';
  end if;

  update public.game_profiles as profile
  set selected_class = class_name,
      updated_at = now()
  where profile.user_id = auth.uid()
    and class_name = any(profile.owned_classes);
  if found then return; end if;

  update public.game_profiles as profile
  set coins = profile.coins - class_cost,
      owned_classes = array_append(profile.owned_classes, class_name),
      selected_class = class_name,
      updated_at = now()
  where profile.user_id = auth.uid()
    and profile.coins >= class_cost;

  if not found then
    raise exception 'Not enough coins';
  end if;
end;
$$;

do $$
begin
  if (
    select count(*)
    from public.game_profiles
    where free_play_hours = 50000
  ) <> 1 then
    raise exception 'Expected exactly one owner profile; policeman unlock cancelled';
  end if;

  update public.game_profiles
  set
    owned_classes = array(
      select distinct class_name
      from unnest(owned_classes || array['policeman']::text[]) as class_name
    ),
    updated_at = now()
  where free_play_hours = 50000;
end;
$$;
