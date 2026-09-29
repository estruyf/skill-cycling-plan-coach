// Server-only WHOOP OAuth + API helpers, used exclusively by route handlers
// under web/app/api/whoop/*. Per whoop-integration-plan.md's resolved
// decision #3, this is the ONLY place in the codebase that holds the WHOOP
// client secret or a Supabase service-role key -- never import this file
// from a client component.
//
// Endpoint paths confirmed against developer.whoop.com's live docs at
// implementation time (the architecture plan flagged these as unconfirmed
// when it was written): the OAuth authorize/token endpoints sit under
// /oauth/oauth2/*, while every data + revoke endpoint sits under the
// separate /developer/v2/* prefix.
import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";

const WHOOP_HOST = "https://api.prod.whoop.com";
const WHOOP_API_BASE = `${WHOOP_HOST}/developer/v2`;

export const WHOOP_AUTHORIZE_URL = `${WHOOP_HOST}/oauth/oauth2/auth`;
export const WHOOP_TOKEN_URL = `${WHOOP_HOST}/oauth/oauth2/token`;
export const WHOOP_REVOKE_URL = `${WHOOP_API_BASE}/user/access`;
export const WHOOP_PROFILE_URL = `${WHOOP_API_BASE}/user/profile/basic`;
export const WHOOP_RECOVERY_URL = `${WHOOP_API_BASE}/recovery`;
export const WHOOP_SLEEP_URL = `${WHOOP_API_BASE}/activity/sleep`;
export const WHOOP_CYCLE_URL = `${WHOOP_API_BASE}/cycle`;
export const WHOOP_WORKOUT_URL = `${WHOOP_API_BASE}/activity/workout`;

// `offline` is required specifically to receive a refresh token back from
// the authorization_code exchange -- WHOOP does not issue one by default
// (confirmed against developer.whoop.com/docs/developing/oauth).
export const WHOOP_SCOPES =
  "read:recovery read:cycles read:sleep read:workout read:profile offline";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var ${name}`);
  return value;
}

export const whoopClientId = () => requiredEnv("WHOOP_CLIENT_ID");
export const whoopClientSecret = () => requiredEnv("WHOOP_CLIENT_SECRET");
export const whoopRedirectUri = () => requiredEnv("WHOOP_REDIRECT_URI");
export const whoopInternalSyncSecret = () => requiredEnv("WHOOP_INTERNAL_SYNC_SECRET");

let cachedServiceClient: SupabaseClient | null = null;

// Service-role client: bypasses RLS entirely, same posture docs/infra.md
// already documents for the skill's own server-side writes. Only ever used
// server-side, inside these route handlers.
export function supabaseServiceClient(): SupabaseClient {
  if (cachedServiceClient) return cachedServiceClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? requiredEnv("SUPABASE_URL");
  const key = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  cachedServiceClient = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cachedServiceClient;
}

function timingSafeEqualStrings(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function bearerToken(request: Request): string | null {
  const header = request.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

// Session-only auth: used by /api/whoop/authorize and /api/whoop/disconnect,
// which are only ever called by the browser (with the signed-in athlete's
// own Supabase access token), never by the skill.
export async function resolveSessionAthleteId(request: Request): Promise<string | null> {
  const token = bearerToken(request);
  if (!token) return null;
  const { data, error } = await supabaseServiceClient().auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

// Dual auth for /api/whoop/sync (WC2): either the browser's own session, or
// this skill's shared internal secret plus an explicit athlete id it has no
// other way to assert (it never holds a Supabase session). The internal
// secret is checked first via a constant-time comparison so its exact value
// never needs to look like (or be parsed as) a Supabase JWT.
export async function resolveSyncAthleteId(
  request: Request,
  bodyAthleteId: string | null
): Promise<string | null> {
  const token = bearerToken(request);
  if (!token) return null;

  if (bodyAthleteId && timingSafeEqualStrings(token, whoopInternalSyncSecret())) {
    return bodyAthleteId;
  }

  const { data, error } = await supabaseServiceClient().auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

interface WhoopStatePayload {
  athleteId: string;
  nonce: string;
  ts: number;
}

const STATE_MAX_AGE_MS = 10 * 60 * 1000;

// Signed, stateless CSRF `state` param: HMAC over a base64url JSON payload
// using the WHOOP client secret as the signing key (already a server-only
// secret dedicated to this integration -- no separate secret needed). No DB
// round trip, so this works across Vercel's independent serverless
// invocations for the authorize and callback requests.
export function signWhoopState(athleteId: string): string {
  const payload: WhoopStatePayload = {
    athleteId,
    nonce: randomBytes(12).toString("hex"),
    ts: Date.now(),
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", whoopClientSecret())
    .update(payloadB64)
    .digest("base64url");
  return `${payloadB64}.${signature}`;
}

export function verifyWhoopState(state: string): string | null {
  const [payloadB64, signature] = state.split(".");
  if (!payloadB64 || !signature) return null;

  const expectedSignature = createHmac("sha256", whoopClientSecret())
    .update(payloadB64)
    .digest("base64url");
  if (!timingSafeEqualStrings(signature, expectedSignature)) return null;

  let payload: WhoopStatePayload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (typeof payload.athleteId !== "string" || typeof payload.ts !== "number") return null;
  if (Date.now() - payload.ts > STATE_MAX_AGE_MS) return null;
  return payload.athleteId;
}

export interface WhoopTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope?: string;
}

export async function exchangeWhoopCode(code: string): Promise<WhoopTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: whoopClientId(),
    client_secret: whoopClientSecret(),
    redirect_uri: whoopRedirectUri(),
  });
  const response = await fetch(WHOOP_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) {
    throw new Error(`WHOOP token exchange failed: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

export async function refreshWhoopToken(refreshToken: string): Promise<WhoopTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: whoopClientId(),
    client_secret: whoopClientSecret(),
    scope: "offline",
  });
  const response = await fetch(WHOOP_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) {
    throw new Error(`WHOOP token refresh failed: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

export async function revokeWhoopToken(accessToken: string): Promise<void> {
  const response = await fetch(WHOOP_REVOKE_URL, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  // A 404 means WHOOP already considers the grant gone -- treat as success
  // so a disconnect retry (or a grant the athlete already revoked from
  // WHOOP's own app settings) isn't blocked from clearing our own state.
  if (!response.ok && response.status !== 404) {
    throw new Error(`WHOOP revoke failed: ${response.status} ${await response.text()}`);
  }
}

export interface WhoopProfile {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
}

export async function fetchWhoopProfile(accessToken: string): Promise<WhoopProfile> {
  const response = await fetch(WHOOP_PROFILE_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new Error(`WHOOP profile fetch failed: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

// Vault-backed token storage, via the security-definer RPC functions from
// migration 20260927130000_whoop_vault_functions.sql (WB1). These are the
// only functions in this codebase that ever see a raw WHOOP token.

export async function storeWhoopTokens(params: {
  athleteId: string;
  whoopUserId: string | null;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}): Promise<void> {
  const { error } = await supabaseServiceClient().rpc("whoop_store_tokens", {
    p_athlete_id: params.athleteId,
    p_whoop_user_id: params.whoopUserId,
    p_access_token: params.accessToken,
    p_refresh_token: params.refreshToken,
    p_expires_at: params.expiresAt.toISOString(),
  });
  if (error) throw new Error(`whoop_store_tokens failed: ${error.message}`);
}

export interface WhoopStoredTokens {
  access_token: string;
  refresh_token: string;
  expires_at: string;
}

export async function getWhoopTokens(athleteId: string): Promise<WhoopStoredTokens | null> {
  const { data, error } = await supabaseServiceClient().rpc("whoop_get_tokens", {
    p_athlete_id: athleteId,
  });
  if (error) throw new Error(`whoop_get_tokens failed: ${error.message}`);
  return (data as WhoopStoredTokens[] | null)?.[0] ?? null;
}

export async function deleteWhoopConnection(athleteId: string): Promise<void> {
  const { error } = await supabaseServiceClient().rpc("whoop_disconnect", {
    p_athlete_id: athleteId,
  });
  if (error) throw new Error(`whoop_disconnect failed: ${error.message}`);
}

// A token is refreshed once it's within this safety margin of expiring, per
// WC2's spec -- avoids a sync failing mid-pull because the token expired
// between the freshness check and the API call.
const TOKEN_REFRESH_MARGIN_MS = 5 * 60 * 1000;

// Returns a currently-valid access token for the athlete's WHOOP
// connection, refreshing and re-storing it first if it's near expiry.
// Returns null if there's no active connection.
export async function getValidWhoopAccessToken(athleteId: string): Promise<string | null> {
  const stored = await getWhoopTokens(athleteId);
  if (!stored) return null;

  const expiresAt = new Date(stored.expires_at).getTime();
  if (expiresAt - Date.now() > TOKEN_REFRESH_MARGIN_MS) {
    return stored.access_token;
  }

  const refreshed = await refreshWhoopToken(stored.refresh_token);
  const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000);
  await storeWhoopTokens({
    athleteId,
    whoopUserId: null,
    accessToken: refreshed.access_token,
    refreshToken: refreshed.refresh_token ?? stored.refresh_token,
    expiresAt: newExpiresAt,
  });
  return refreshed.access_token;
}
