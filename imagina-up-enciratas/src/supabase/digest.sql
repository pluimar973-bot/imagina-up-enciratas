-- GastaBot · recomendaciones por correo (pégalo en Supabase › SQL Editor, una sola vez).
alter table profiles add column if not exists email_digest boolean not null default false;
alter table profiles add column if not exists digest_freq  text    not null default 'weekly' check (digest_freq in ('weekly','monthly'));
alter table profiles add column if not exists last_digest  timestamptz;

-- El usuario no debe poder inventar su fecha de último envío: sólo la función (service role) la escribe.
create or replace function protect_last_digest() returns trigger language plpgsql as
$$ begin if new.last_digest is distinct from old.last_digest and auth.role() <> 'service_role' then new.last_digest := old.last_digest; end if; return new; end $$;
drop trigger if exists profiles_protect_last_digest on profiles;
create trigger profiles_protect_last_digest before update on profiles for each row execute function protect_last_digest();

-- Programar el envío diario (9:00 hora de México = 15:00 UTC). La función decide a quién le toca según su frecuencia.
-- Antes: Database › Extensions › activa pg_cron y pg_net. Cambia TU_REF, TU_ANON_KEY y TU_SECRETO_DIGEST.
-- select cron.schedule('gastabot-digest', '0 15 * * *', $$
--   select net.http_post(
--     url := 'https://TU_REF.supabase.co/functions/v1/gastabot-digest',
--     headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer TU_ANON_KEY','x-digest-secret','TU_SECRETO_DIGEST'),
--     body := '{}'::jsonb) $$);
