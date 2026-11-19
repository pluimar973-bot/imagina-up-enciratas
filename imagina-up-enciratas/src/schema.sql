-- GastaBot AGS · esquema Supabase (pégalo en SQL Editor). Ciudad › Plaza › Tienda › Ofertas.
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  name text, plaza text, budget int,
  role text not null default 'user'            -- 'admin' lo asignas tú a mano
);
create table if not exists stores (
  id text primary key, city text not null, plaza text not null, name text not null,
  cats text[] default '{}', min_ticket int, max_ticket int, site text, phone text,
  rating numeric, price_level text, verified boolean default false, source text default 'manual',
  items jsonb, zone int, hours jsonb, updated_at timestamptz default now()
);
create table if not exists offers (
  id uuid primary key default gen_random_uuid(),
  store_id text, store_name text, text text not null, valid_until date not null,
  created_by uuid default auth.uid(), created_at timestamptz default now()
);
create table if not exists favorites (user_id uuid references auth.users on delete cascade, store_id text, primary key (user_id, store_id));
create table if not exists searches (id bigserial primary key, user_id uuid references auth.users on delete cascade, query text, budget int, created_at timestamptz default now());

create table if not exists chats (
  id text primary key, user_id uuid not null default auth.uid() references auth.users on delete cascade,
  title text, messages jsonb not null default '[]', updated_at timestamptz default now()
);

alter table profiles  enable row level security;
alter table chats     enable row level security;
alter table stores    enable row level security;
alter table offers    enable row level security;
alter table favorites enable row level security;
alter table searches  enable row level security;

create or replace function is_admin() returns boolean language sql stable as
$$ select exists (select 1 from profiles where id = auth.uid() and role = 'admin') $$;

-- Lectura pública de tiendas y ofertas; sólo admin escribe.
create policy "stores read"   on stores for select using (true);
create policy "stores admin"  on stores for all using (is_admin()) with check (is_admin());
create policy "offers read"   on offers for select using (true);
create policy "offers admin"  on offers for all using (is_admin()) with check (is_admin());
-- Cada usuario sólo ve/edita lo suyo.
create policy "profile own read"   on profiles for select using (id = auth.uid());
create policy "profile own insert" on profiles for insert with check (id = auth.uid() and role = 'user');
create policy "profile own update" on profiles for update using (id = auth.uid()) with check (id = auth.uid());
-- El rol no se puede auto-asignar: un trigger revierte cualquier cambio de 'role' si quien edita no es admin.
create or replace function protect_role() returns trigger language plpgsql as
$$ begin if new.role is distinct from old.role and not is_admin() then new.role := old.role; end if; return new; end $$;
create trigger profiles_protect_role before update on profiles for each row execute function protect_role();
create policy "fav own"      on favorites for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "chat own"     on chats     for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "search own"   on searches  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Para volverte admin (una vez registrado): update profiles set role='admin' where id = '<tu-uuid>';
