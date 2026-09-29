// WB1: WHOOP's OAuth redirect target. This request comes straight from the
// athlete's browser navigating away from WHOOP, so it carries no Supabase
// session -- the signed `state` param (WB1's signWhoopState, verified here)
// is the only thing identifying which athlete this is, not an auth header.
import { NextResponse } from "next/server";
import {
  exchangeWhoopCode,
  fetchWhoopProfile,
  storeWhoopTokens,
  verifyWhoopState,
} from "@/lib/whoopServer";

function redirectToConnections(
  request: Request,
  status: "connected" | "error",
  message?: string
) {
  const url = new URL("/connections", request.url);
  url.searchParams.set("whoop", status);
  if (message) url.searchParams.set("whoop_message", message);
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const whoopError = url.searchParams.get("error");

  if (whoopError) {
    return redirectToConnections(request, "error", whoopError);
  }
  if (!code || !state) {
    return redirectToConnections(request, "error", "missing_code_or_state");
  }

  const athleteId = verifyWhoopState(state);
  if (!athleteId) {
    return redirectToConnections(request, "error", "invalid_state");
  }

  try {
    const tokens = await exchangeWhoopCode(code);
    if (!tokens.refresh_token) {
      throw new Error("WHOOP did not return a refresh token (offline scope missing?)");
    }

    const profile = await fetchWhoopProfile(tokens.access_token);

    await storeWhoopTokens({
      athleteId,
      whoopUserId: String(profile.user_id),
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
    });
  } catch (error) {
    console.error("WHOOP callback failed", error);
    return redirectToConnections(request, "error", "exchange_failed");
  }

  return redirectToConnections(request, "connected");
}
