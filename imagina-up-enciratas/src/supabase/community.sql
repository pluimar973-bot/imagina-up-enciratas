-- GastaBot · Comunidad (pégalo en Supabase › SQL Editor, una sola vez). Requiere schema.sql ya corrido.
create table if not exists community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  author text, kind text not null check (kind in ('oferta','lugar','idea')),
  title text not null check (char_length(title) between 3 and 80),
  body text check (char_length(body) <= 400),
  store text check (char_length(store) <= 60), plaza text,
  likes int not null default 0, hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists community_likes (post_id uuid references community_posts on delete cascade, user_id uuid default auth.uid() references auth.users on delete cascade, primary key (post_id, user_id));
create table if not exists community_reports (post_id uuid references community_posts on delete cascade, user_id uuid default auth.uid() references auth.users on delete cascade, primary key (post_id, user_id), created_at timestamptz default now());
create index if not exists community_posts_new on community_posts (created_at desc);

-- Autor real (no se puede falsear) y tope de 10 publicaciones por día por usuario
create or replace function community_before_insert() returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.author := coalesce((select nullif(name,'') from profiles where id = auth.uid()), 'Anónimo');
  if (select count(*) from community_posts where user_id = auth.uid() and created_at > now() - interval '1 day') >= 10 then
    raise exception 'Límite de 10 publicaciones por día';
  end if;
  return new;
end $$;
drop trigger if exists community_posts_bi on community_posts;
create trigger community_posts_bi before insert on community_posts for each row execute function community_before_insert();

-- Contador de «me gusta» y auto-ocultar con 3 reportes de personas distintas
create or replace function community_like_count() returns trigger language plpgsql security definer set search_path = public as $$
begin update community_posts set likes = (select count(*) from community_likes where post_id = coalesce(new.post_id, old.post_id)) where id = coalesce(new.post_id, old.post_id); return null; end $$;
drop trigger if exists community_likes_ai on community_likes;
create trigger community_likes_ai after insert or delete on community_likes for each row execute function community_like_count();
create or replace function community_report_check() returns trigger language plpgsql security definer set search_path = public as $$
begin update community_posts set hidden = true where id = new.post_id and (select count(*) from community_reports where post_id = new.post_id) >= 3; return null; end $$;
drop trigger if exists community_reports_ai on community_reports;
create trigger community_reports_ai after insert on community_reports for each row execute function community_report_check();

alter table community_posts enable row level security;
alter table community_likes enable row level security;
alter table community_reports enable row level security;
create policy "com read"    on community_posts for select using (hidden = false or user_id = auth.uid() or is_admin());
create policy "com insert"  on community_posts for insert with check (user_id = auth.uid() and likes = 0 and hidden = false);
create policy "com delete"  on community_posts for delete using (user_id = auth.uid() or is_admin());
create policy "com admin"   on community_posts for update using (is_admin()) with check (is_admin());   -- el admin puede ocultar/mostrar
create policy "likes read"  on community_likes for select using (user_id = auth.uid());
create policy "likes add"   on community_likes for insert with check (user_id = auth.uid());
create policy "likes del"   on community_likes for delete using (user_id = auth.uid());
create policy "rep add"     on community_reports for insert with check (user_id = auth.uid());
create policy "rep admin"   on community_reports for select using (is_admin());
