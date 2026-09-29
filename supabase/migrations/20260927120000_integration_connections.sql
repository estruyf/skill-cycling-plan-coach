-- WA2 (documents/whoop-integration-tasks.md): integration_connections schema
-- + RLS. First table backing an OAuth-based data-source connection (WHOOP);
-- `provider` is a checked column rather than a separate provider table,
-- future-proofing beyond WHOOP without building a plugin framework now, per
-- whoop-integration-plan.md's non-goals.
--
-- Token storage: access/refresh tokens themselves are never stored here --
-- only the Supabase Vault secret ids they're stored under
-- (`vault.create_secret`/`vault.decrypted_secrets`, service_role-only by
-- default, already installed on this project as the `supabase_vault`
-- extension). All writes to this table happen through the service-role
-- Supabase client inside web/app/api/whoop/{authorize,callback,disconnect}
-- route handlers (WB1) -- never from the browser's anon-key client, which is
-- why there is no insert/update/delete policy below, only select.

create table integration_connections (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  athlete_id uuid not null references athletes (id) on delete cascade,

  provider text not null check (provider = 'whoop'),
  whoop_user_id text,
  access_token_id uuid,
  refresh_token_id uuid,
  expires_at timestamptz not null,
  connected_at timestamptz not null default now(),
  revoked_at timestamptz,

  unique (athlete_id, provider)
);

alter table integration_connections enable row level security;

-- Select-only: the browser's anon-key client can read connection *state*
-- (for the /connections UI) but can never insert/update/delete a row -- all
-- writes go through the service-role-holding route handlers in WB1.
create policy "integration_connections_self_select" on integration_connections
  for select using (auth.uid() = athlete_id);
