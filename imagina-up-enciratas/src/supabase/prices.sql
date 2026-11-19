-- GastaBot v2.1 · Precios locales (madera, materiales, abarrotes, servicios…). Corre DESPUÉS de schema.sql.
create table if not exists price_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  author text,
  category text not null check (category in ('materiales','servicios','abarrotes','mercado','refacciones','telas','otros')),
  product text not null check (char_length(product) between 2 and 80),
  unit text not null check (char_length(unit) between 1 and 30),
  price numeric(12,2) not null check (price > 0 and price <= 1000000),
  place text not null check (char_length(place) between 2 and 60),
  zone text check (char_length(zone) <= 60),
  note text check (char_length(note) <= 200),
  seen_on date not null default current_date,
  still_ok int not null default 0, gone int not null default 0, hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists price_reports_prod on price_reports (lower(product));
create index if not exists price_reports_new on price_reports (seen_on desc);

-- Autor real, fecha de «visto» entre hace 30 días y hoy, y tope de 40 registros por día por persona
create or replace function price_before_insert() returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.author := coalesce((select nullif(name,'') from profiles where id = auth.uid()), 'Anónimo');
  if new.seen_on > current_date or new.seen_on < current_date - 30 then raise exception 'La fecha en que viste el precio debe ser de los últimos 30 días'; end if;
  if (select count(*) from price_reports where user_id = auth.uid() and created_at > now() - interval '1 day') >= 40 then raise exception 'Límite de 40 precios por día'; end if;
  return new;
end $$;
drop trigger if exists price_reports_bi on price_reports;
create trigger price_reports_bi before insert on price_reports for each row execute function price_before_insert();

create table if not exists price_votes (
  post_id uuid references price_reports on delete cascade,
  user_id uuid default auth.uid() references auth.users on delete cascade,
  ok boolean not null, primary key (post_id, user_id), created_at timestamptz default now());
create table if not exists price_flags (
  post_id uuid references price_reports on delete cascade,
  user_id uuid default auth.uid() references auth.users on delete cascade,
  primary key (post_id, user_id), created_at timestamptz default now());

-- «Sigue así» / «Ya cambió»; con 3 «ya cambió» y más que «sigue así» se oculta. 3 reportes de personas distintas también la ocultan.
create or replace function price_vote_count() returns trigger language plpgsql security definer set search_path = public as $$
declare pid uuid := coalesce(new.post_id, old.post_id); a int; b int;
begin
  select count(*) filter (where ok), count(*) filter (where not ok) into a, b from price_votes where post_id = pid;
  update price_reports set still_ok = a, gone = b, hidden = hidden or (b >= 3 and b > a) where id = pid; return null;
end $$;
drop trigger if exists price_votes_aiud on price_votes;
create trigger price_votes_aiud after insert or update or delete on price_votes for each row execute function price_vote_count();
create or replace function price_flag_check() returns trigger language plpgsql security definer set search_path = public as $$
begin update price_reports set hidden = true where id = new.post_id and (select count(*) from price_flags where post_id = new.post_id) >= 3; return null; end $$;
drop trigger if exists price_flags_ai on price_flags;
create trigger price_flags_ai after insert on price_flags for each row execute function price_flag_check();

alter table price_reports enable row level security;
alter table price_votes enable row level security;
alter table price_flags enable row level security;
create policy "pr read"   on price_reports for select using (hidden = false or user_id = auth.uid() or is_admin());
create policy "pr insert" on price_reports for insert with check (user_id = auth.uid() and still_ok = 0 and gone = 0 and hidden = false);
create policy "pr delete" on price_reports for delete using (user_id = auth.uid() or is_admin());
create policy "pr admin"  on price_reports for update using (is_admin()) with check (is_admin());
create policy "pv read"   on price_votes for select using (user_id = auth.uid());
create policy "pv add"    on price_votes for insert with check (user_id = auth.uid() and not exists (select 1 from price_reports p where p.id = post_id and p.user_id = auth.uid()));
create policy "pv upd"    on price_votes for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "pv del"    on price_votes for delete using (user_id = auth.uid());
create policy "pf add"    on price_flags for insert with check (user_id = auth.uid());
create policy "pf admin"  on price_flags for select using (is_admin());

-- «Necesito cotización»: peticiones para productos o servicios que nadie ha registrado. Máx. 5 por día por persona.
create table if not exists price_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  author text,
  category text not null check (category in ('materiales','servicios','abarrotes','mercado','refacciones','telas','otros')),
  product text not null check (char_length(product) between 3 and 100),
  zone text check (char_length(zone) <= 60),
  note text check (char_length(note) <= 200),
  created_at timestamptz not null default now()
);
create or replace function price_req_before_insert() returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.author := coalesce((select nullif(name,'') from profiles where id = auth.uid()), 'Anónimo');
  if (select count(*) from price_requests where user_id = auth.uid() and created_at > now() - interval '1 day') >= 5 then raise exception 'Límite de 5 cotizaciones por día'; end if;
  return new;
end $$;
drop trigger if exists price_requests_bi on price_requests;
create trigger price_requests_bi before insert on price_requests for each row execute function price_req_before_insert();
alter table price_requests enable row level security;
create policy "req read"   on price_requests for select using (created_at > now() - interval '30 days' or user_id = auth.uid() or is_admin());
create policy "req insert" on price_requests for insert with check (user_id = auth.uid());
create policy "req delete" on price_requests for delete using (user_id = auth.uid() or is_admin());
