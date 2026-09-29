-- WB1 (documents/whoop-integration-tasks.md): Vault-backed WHOOP token
-- storage, exposed only to service_role via security definer RPC
-- functions. `vault.create_secret`/`vault.update_secret`/
-- `vault.decrypted_secrets` live in the `vault` schema, which is not
-- exposed through PostgREST/RLS at all -- these wrapper functions (owned
-- by the migration-running role, which has vault access; `security
-- definer` runs them with that owner's privileges) are the only way the
-- service-role Supabase client used by web/app/api/whoop/* route handlers
-- can create/read/delete a WHOOP token secret, keeping the
-- "service_role-only" posture from whoop-integration-plan.md's resolved
-- decision #3 without an app-level crypto library. Explicitly revoked from
-- `anon`/`authenticated` below so a browser session can never call these
-- even if it discovered the function names.

create or replace function public.whoop_store_tokens(
  p_athlete_id uuid,
  p_whoop_user_id text,
  p_access_token text,
  p_refresh_token text,
  p_expires_at timestamptz
) returns void
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  v_access_id uuid;
  v_refresh_id uuid;
  v_existing record;
begin
  select access_token_id, refresh_token_id into v_existing
  from integration_connections
  where athlete_id = p_athlete_id and provider = 'whoop';

  if v_existing.access_token_id is not null then
    perform vault.update_secret(v_existing.access_token_id, p_access_token);
    v_access_id := v_existing.access_token_id;
  else
    v_access_id := vault.create_secret(
      p_access_token, 'whoop_access_token_' || p_athlete_id, 'WHOOP OAuth access token', null
    );
  end if;

  if v_existing.refresh_token_id is not null then
    perform vault.update_secret(v_existing.refresh_token_id, p_refresh_token);
    v_refresh_id := v_existing.refresh_token_id;
  else
    v_refresh_id := vault.create_secret(
      p_refresh_token, 'whoop_refresh_token_' || p_athlete_id, 'WHOOP OAuth refresh token', null
    );
  end if;

  insert into integration_connections
    (athlete_id, provider, whoop_user_id, access_token_id, refresh_token_id, expires_at, connected_at, revoked_at)
  values
    (p_athlete_id, 'whoop', p_whoop_user_id, v_access_id, v_refresh_id, p_expires_at, now(), null)
  on conflict (athlete_id, provider) do update
    set whoop_user_id = coalesce(excluded.whoop_user_id, integration_connections.whoop_user_id),
        access_token_id = excluded.access_token_id,
        refresh_token_id = excluded.refresh_token_id,
        expires_at = excluded.expires_at,
        revoked_at = null;
end;
$$;

revoke all on function public.whoop_store_tokens(uuid, text, text, text, timestamptz) from public, anon, authenticated;
grant execute on function public.whoop_store_tokens(uuid, text, text, text, timestamptz) to service_role;

create or replace function public.whoop_get_tokens(p_athlete_id uuid)
returns table(access_token text, refresh_token text, expires_at timestamptz)
language plpgsql
security definer
set search_path = public, vault
as $$
begin
  return query
  select ds_access.decrypted_secret, ds_refresh.decrypted_secret, ic.expires_at
  from integration_connections ic
  join vault.decrypted_secrets ds_access on ds_access.id = ic.access_token_id
  join vault.decrypted_secrets ds_refresh on ds_refresh.id = ic.refresh_token_id
  where ic.athlete_id = p_athlete_id
    and ic.provider = 'whoop'
    and ic.revoked_at is null;
end;
$$;

revoke all on function public.whoop_get_tokens(uuid) from public, anon, authenticated;
grant execute on function public.whoop_get_tokens(uuid) to service_role;

create or replace function public.whoop_disconnect(p_athlete_id uuid)
returns void
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  v_access_id uuid;
  v_refresh_id uuid;
begin
  select access_token_id, refresh_token_id into v_access_id, v_refresh_id
  from integration_connections
  where athlete_id = p_athlete_id and provider = 'whoop';

  delete from integration_connections where athlete_id = p_athlete_id and provider = 'whoop';

  if v_access_id is not null then
    delete from vault.secrets where id = v_access_id;
  end if;
  if v_refresh_id is not null then
    delete from vault.secrets where id = v_refresh_id;
  end if;
end;
$$;

revoke all on function public.whoop_disconnect(uuid) from public, anon, authenticated;
grant execute on function public.whoop_disconnect(uuid) to service_role;
