-- GastaBot v1.9 · ofertas de la comunidad con vigencia y confirmaciones (corre DESPUÉS de community.sql).
alter table community_posts add column if not exists valid_until date;
alter table community_posts add column if not exists still_ok int not null default 0;
alter table community_posts add column if not exists gone int not null default 0;
-- Toda oferta nueva debe traer vigencia (las anteriores se respetan: «not valid»)
alter table community_posts drop constraint if exists community_offer_needs_date;
alter table community_posts add constraint community_offer_needs_date check (kind <> 'oferta' or valid_until is not null) not valid;

-- Inserción: sin contadores falsos y vigencia razonable (hoy … +120 días)
drop policy if exists "com insert" on community_posts;
create policy "com insert" on community_posts for insert with check (
  user_id = auth.uid() and likes = 0 and hidden = false and still_ok = 0 and gone = 0
  and (valid_until is null or (valid_until >= current_date and valid_until <= current_date + 120)));

-- «Sigue vigente» (ok = true) / «Ya no» (ok = false): una persona, un voto, nunca en su propia publicación
create table if not exists community_votes (
  post_id uuid references community_posts on delete cascade,
  user_id uuid default auth.uid() references auth.users on delete cascade,
  ok boolean not null, primary key (post_id, user_id), created_at timestamptz default now());
alter table community_votes enable row level security;
create policy "votes read" on community_votes for select using (user_id = auth.uid());
create policy "votes add"  on community_votes for insert with check (user_id = auth.uid() and not exists (select 1 from community_posts p where p.id = post_id and p.user_id = auth.uid()));
create policy "votes upd"  on community_votes for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "votes del"  on community_votes for delete using (user_id = auth.uid());

create or replace function community_vote_count() returns trigger language plpgsql security definer set search_path = public as $$
declare pid uuid := coalesce(new.post_id, old.post_id); a int; b int;
begin
  select count(*) filter (where ok), count(*) filter (where not ok) into a, b from community_votes where post_id = pid;
  -- con 3 «ya no» y más «ya no» que «sigue vigente», la oferta se oculta sola
  update community_posts set still_ok = a, gone = b, hidden = hidden or (b >= 3 and b > a) where id = pid;
  return null;
end $$;
drop trigger if exists community_votes_aiud on community_votes;
create trigger community_votes_aiud after insert or update or delete on community_votes for each row execute function community_vote_count();
