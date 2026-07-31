alter table public.game_profiles
  add column selected_class text not null default 'attendant',
  add column owned_classes text[] not null default array['attendant']::text[];

alter table public.game_profiles
  add constraint game_profiles_selected_class_check
    check (selected_class in ('attendant', 'guard', 'rifleman', 'medic', 'retired_hunter')),
  add constraint game_profiles_owned_classes_check
    check (selected_class = any(owned_classes));

create function public.buy_game_class(class_name text)
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

create function public.select_game_class(class_name text)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  update public.game_profiles as profile
  set selected_class = class_name,
      updated_at = now()
  where profile.user_id = auth.uid()
    and class_name = any(profile.owned_classes);

  if not found then
    raise exception 'Class not owned';
  end if;
end;
$$;

revoke all on function public.buy_game_class(text) from public;
revoke all on function public.select_game_class(text) from public;
grant execute on function public.buy_game_class(text) to authenticated;
grant execute on function public.select_game_class(text) to authenticated;
