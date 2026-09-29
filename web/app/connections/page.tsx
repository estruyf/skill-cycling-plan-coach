"use client";

import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import type { IntegrationConnection } from "@/lib/types";
import { AppShell } from "../components/AppShell";
import { Centered } from "../components/Centered";

const FEATURE_ITEMS = [
  { label: "Daily recovery, sleep & strain", sub: "feeds the same readiness logic Garmin already drives" },
  { label: "Per-workout strain & HR", sub: "matched back to each logged session as an objective cross-check" },
  { label: "No manual export", sub: "connect once — every sync after that is automatic" },
];

type LoadState = "loading" | "no-session" | "ready" | "error";
type ActionState = "idle" | "connecting" | "disconnecting";

export default function ConnectionsPage() {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [connection, setConnection] = useState<IntegrationConnection | null>(null);
  const [actionState, setActionState] = useState<ActionState>("idle");
  // Lazy initializer (not an effect) reading the callback route's redirect
  // status (?whoop=connected|error) off window.location.search directly --
  // a one-shot read with no need to re-render on navigation, so it avoids
  // both the react-hooks set-state-in-effect rule and the Suspense-boundary
  // requirement useSearchParams would otherwise impose on a static build.
  const [banner, setBanner] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    const status = params.get("whoop");
    if (!status) return null;
    return status === "connected"
      ? "WHOOP connected."
      : `Couldn't connect WHOOP (${params.get("whoop_message") ?? "unknown error"}). Try again.`;
  });

  const loadConnection = useCallback(async (athleteId: string) => {
    const { data, error } = await supabase
      .from("integration_connections")
      .select("*")
      .eq("athlete_id", athleteId)
      .eq("provider", "whoop")
      .is("revoked_at", null)
      .maybeSingle();

    if (error) {
      setErrorMessage(error.message);
      setLoadState("error");
      return;
    }

    setConnection(data ?? null);
    setLoadState("ready");
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        setLoadState("no-session");
        return;
      }
      setSession(data.session);
      loadConnection(data.session.user.id);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        if (newSession) {
          loadConnection(newSession.user.id);
        } else {
          setLoadState("no-session");
        }
      }
    );

    return () => subscription.subscription.unsubscribe();
  }, [loadConnection]);

  // Strips the callback route's redirect query params from the visible URL
  // once they've been read by the lazy state initializer above.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.location.search.includes("whoop")) return;
    window.history.replaceState({}, "", "/connections");
  }, []);

  async function handleConnect() {
    if (!session) return;
    setActionState("connecting");
    setErrorMessage("");

    const response = await fetch("/api/whoop/authorize", {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (!response.ok) {
      setActionState("idle");
      setErrorMessage("Couldn't start the WHOOP connection. Try again.");
      return;
    }

    const { url } = await response.json();
    window.location.href = url;
  }

  async function handleDisconnect() {
    if (!session) return;
    setActionState("disconnecting");
    setErrorMessage("");

    const response = await fetch("/api/whoop/disconnect", {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    setActionState("idle");

    if (!response.ok) {
      setErrorMessage("Couldn't disconnect WHOOP. Try again.");
      return;
    }

    setConnection(null);
    setBanner("WHOOP disconnected.");
  }

  async function signOut() {
    await supabase.auth.signOut();
    setLoadState("no-session");
  }

  if (loadState === "loading") {
    return <Centered>Loading…</Centered>;
  }

  if (loadState === "no-session") {
    return (
      <Centered>
        <p>You&apos;re not signed in.</p>
        <a href="/login" className="btn btn-primary justify-self-center">
          Sign in
        </a>
      </Centered>
    );
  }

  if (loadState === "error") {
    return (
      <Centered>
        <p style={{ color: "var(--critical)" }}>Something went wrong: {errorMessage}</p>
      </Centered>
    );
  }

  return (
    <AppShell active="connections" athleteEmail={session?.user.email ?? ""} onSignOut={signOut}>
      <div className="mb-5">
        <div className="eyebrow">Data sources</div>
        <h1 className="page-title">Connections</h1>
        <p className="page-sub">
          Optional — connecting WHOOP doesn&apos;t change anything about your
          plan unless you link it here.
        </p>
      </div>

      {banner && (
        <div className="card mb-4 p-3.5" style={{ borderColor: "var(--brand)" }}>
          {banner}
        </div>
      )}

      {errorMessage && (
        <p className="mb-4 text-sm" style={{ color: "var(--critical)" }}>
          {errorMessage}
        </p>
      )}

      <div className="card p-5 nav:p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-[15px] font-bold">WHOOP</h2>
            {connection ? (
              <p className="page-sub mt-0.5">
                Connected since{" "}
                {new Date(connection.connected_at).toLocaleDateString()}
              </p>
            ) : (
              <p className="page-sub mt-0.5">Not connected</p>
            )}
          </div>
          {connection ? (
            <button
              onClick={handleDisconnect}
              disabled={actionState !== "idle"}
              className="btn btn-ghost btn-sm"
            >
              {actionState === "disconnecting" ? "Disconnecting…" : "Disconnect"}
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={actionState !== "idle"}
              className="btn btn-primary btn-sm"
            >
              {actionState === "connecting" ? "Connecting…" : "Connect WHOOP"}
            </button>
          )}
        </div>

        {!connection && (
          <div className="flex flex-col gap-2.5 border-t border-[var(--line)] pt-4">
            {FEATURE_ITEMS.map((item) => (
              <div key={item.label} className="flex flex-col">
                <span className="text-[13.5px] font-semibold">{item.label}</span>
                <span className="text-[12.5px] text-[var(--ink-soft)]">{item.sub}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
