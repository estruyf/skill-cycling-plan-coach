// WB1: disconnect flow. Hard-deletes the connection row and both Vault
// secrets (never a soft flag), per whoop-integration-plan.md's connect-flow
// section.
import { NextResponse } from "next/server";
import {
  deleteWhoopConnection,
  getWhoopTokens,
  resolveSessionAthleteId,
  revokeWhoopToken,
} from "@/lib/whoopServer";

export async function POST(request: Request) {
  const athleteId = await resolveSessionAthleteId(request);
  if (!athleteId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const tokens = await getWhoopTokens(athleteId);
  if (tokens) {
    try {
      await revokeWhoopToken(tokens.access_token);
    } catch (error) {
      // Don't block the athlete's local disconnect on WHOOP's revoke
      // endpoint being unreachable, or the grant already having been
      // revoked from WHOOP's own app settings -- either way, the athlete's
      // intent here ("disconnect") is fully satisfied by clearing our own
      // Vault secrets and connection row below.
      console.error("WHOOP revoke failed during disconnect", error);
    }
  }

  await deleteWhoopConnection(athleteId);
  return NextResponse.json({ ok: true });
}
