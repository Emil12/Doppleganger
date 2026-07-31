alter table public.game_profiles
  add column display_name text not null default 'PLAYER'
  check (char_length(display_name) between 2 and 24);

update public.game_profiles as profile
set display_name = upper(left(coalesce(
  nullif(trim(account.raw_user_meta_data ->> 'full_name'), ''),
  nullif(split_part(account.email, '@', 1), ''),
  'PLAYER-' || left(profile.user_id::text, 4)
), 24))
from auth.users as account
where account.id = profile.user_id;

create index game_profiles_display_name_search_idx
  on public.game_profiles (lower(display_name) text_pattern_ops);

create table public.game_friends (
  user_id uuid not null references public.game_profiles (user_id) on delete cascade,
  friend_id uuid not null references public.game_profiles (user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id),
  check (user_id <> friend_id)
);

alter table public.game_friends enable row level security;

create policy "read own friendships"
  on public.game_friends for select
  using (auth.uid() = user_id);

create policy "add own friendships"
  on public.game_friends for insert
  with check (auth.uid() = user_id);

create policy "remove own friendships"
  on public.game_friends for delete
  using (auth.uid() = user_id);

create function public.search_game_players(search_text text)
returns table (player_id uuid, display_name text)
language sql
stable
security definer
set search_path = public
as $$
  select profile.user_id, profile.display_name
  from public.game_profiles as profile
  where auth.uid() is not null
    and profile.user_id <> auth.uid()
    and char_length(trim(search_text)) >= 2
    and lower(profile.display_name) like lower(trim(search_text)) || '%'
    and not exists (
      select 1 from public.game_friends as friendship
      where friendship.user_id = auth.uid()
        and friendship.friend_id = profile.user_id
    )
  order by lower(profile.display_name)
  limit 10;
$$;

create function public.list_game_friends()
returns table (player_id uuid, display_name text)
language sql
stable
security definer
set search_path = public
as $$
  select profile.user_id, profile.display_name
  from public.game_friends as friendship
  join public.game_profiles as profile on profile.user_id = friendship.friend_id
  where friendship.user_id = auth.uid()
  order by lower(profile.display_name);
$$;

revoke all on function public.search_game_players(text) from public;
revoke all on function public.list_game_friends() from public;
grant execute on function public.search_game_players(text) to authenticated;
grant execute on function public.list_game_friends() to authenticated;
