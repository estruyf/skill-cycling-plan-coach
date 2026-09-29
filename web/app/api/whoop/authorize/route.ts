// WB1: begins the WHOOP OAuth connect flow. Called by the browser (with the
// signed-in athlete's own Supabase access token) from /connections, which
// then navigates to the returned URL itself -- keeping the access token out
// of the browser's address bar/history entirely (it only ever travels in
// this fetch's Authorization header).
import { NextResponse } from "next/server";
import {
  WHOOP_AUTHORIZE_URL,
  WHOOP_SCOPES,
  resolveSessionAthleteId,
  signWhoopState,
  whoopClientId,
  whoopRedirectUri,
} from "@/lib/whoopServer";

export async function POST(request: Request) {
  const athleteId = await resolveSessionAthleteId(request);
  if (!athleteId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const params = new URLSearchParams({
    response_type: "code",
    client_id: whoopClientId(),
    redirect_uri: whoopRedirectUri(),
    scope: WHOOP_SCOPES,
    state: signWhoopState(athleteId),
  });

  return NextResponse.json({ url: `${WHOOP_AUTHORIZE_URL}?${params.toString()}` });
}
