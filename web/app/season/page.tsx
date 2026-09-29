"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import {
  SEASON_PHASE_LABELS,
  TRIAL_EVENT_COMPLETION_STATUS_LABELS,
  TRIAL_EVENT_FUELING_SIGNAL_LABELS,
  type SeasonPlan,
  type SeasonPlanPhase,
  type TrialEvent,
  type TrialEventSpec,
} from "@/lib/types";
import { AppShell } from "../components/AppShell";
import { Centered } from "../components/Centered";
import { IconChevronRight } from "../components/icons";

type LoadState = "loading" | "no-session" | "no-season-plan" | "ready" | "error";

function daysUntil(dateStr: string): number {
  const today = new Date(new Date().toISOString().slice(0, 10));
  const target = new Date(dateStr);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

function daysBetween(startStr: string, endStr: string): number {
  return Math.round(
    (new Date(endStr).getTime() - new Date(startStr).getTime()) / 86_400_000
  );
}

function weeksBetween(startStr: string, endStr: string): string {
  const days = daysBetween(startStr, endStr);
  const weeks = Math.floor(days / 7);
  const extraDays = days % 7;
  return extraDays === 0 ? `${weeks} wk` : `${weeks} wk + ${extraDays}d`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

const PHASE_STYLE: Record<string, { bg: string; color: string }> = {
  base: { bg: "var(--brand-tint)", color: "var(--brand-strong)" },
  "deload-1": { bg: "var(--line-soft)", color: "var(--ink-soft)" },
  build: { bg: "var(--brand)", color: "#fff" },
  "deload-2": { bg: "var(--line-soft)", color: "var(--ink-soft)" },
  refine: { bg: "var(--accent-tint)", color: "#9A3E15" },
};

function specChips(spec: TrialEventSpec): string[] {
  const chips: string[] = [];
  if (spec.distance_km != null) {
    chips.push(
      Array.isArray(spec.distance_km)
        ? `${spec.distance_km[0]}–${spec.distance_km[1]} km`
        : `${spec.distance_km} km`
    );
  }
  if (spec.elevation_m != null) {
    chips.push(
      Array.isArray(spec.elevation_m)
        ? `~${spec.elevation_m[0]}–${spec.elevation_m[1]} m`
        : `~${spec.elevation_m} m`
    );
  }
  if (spec.loaded_bike) chips.push("loaded-bike");
  if (spec.overnight) chips.push("overnight");
  if (spec.opportunistic_resupply) chips.push("opportunistic resupply");
  chips.push(spec.terrain_fidelity === "high" ? "high-fidelity terrain" : "representative terrain");
  return chips;
}

function outcomeBadgeRole(event: TrialEvent): "good" | "warning" | "serious" | "critical" {
  if (!event.outcome) return "good";
  if (event.outcome.completion_status === "dnf_stopped_early") return "critical";
  if (event.outcome.completion_status === "skipped") return "serious";
  if (
    event.outcome.completion_status === "completed_with_difficulty" ||
    event.outcome.fueling_signal === "gi_distress" ||
    event.outcome.fueling_signal === "bonked_underfueled"
  ) {
    return "warning";
  }
  return "good";
}

export default function SeasonPage() {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [seasonPlan, setSeasonPlan] = useState<SeasonPlan | null>(null);

  const loadSeasonPlan = useCallback(async (athleteId: string) => {
    const { data, error } = await supabase
      .from("season_plans")
      .select("*")
      .eq("athlete_id", athleteId)
      .limit(1);

    if (error) {
      setErrorMessage(error.message);
      setLoadState("error");
      return;
    }

    const plan = data?.[0] ?? null;
    if (!plan) {
      setLoadState("no-season-plan");
      return;
    }
    setSeasonPlan(plan);
    setLoadState("ready");
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        setLoadState("no-session");
        return;
      }
      setSession(data.session);
      loadSeasonPlan(data.session.user.id);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        if (newSession) {
          loadSeasonPlan(newSession.user.id);
        } else {
          setLoadState("no-session");
        }
      }
    );

    return () => subscription.subscription.unsubscribe();
  }, [loadSeasonPlan]);

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
        <Link href="/login" className="btn btn-primary justify-self-center">
          Sign in
        </Link>
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

  if (loadState === "no-season-plan") {
    return (
      <Centered>
        <p>
          No season plan yet. This appears once your coach sets a target
          event with an event date.
        </p>
        <Link href="/plan" className="btn btn-ghost justify-self-center">
          Back to this week&apos;s plan
        </Link>
      </Centered>
    );
  }

  const plan = seasonPlan!;
  const days = daysUntil(plan.event_date);
  const currentPhaseLabel = SEASON_PHASE_LABELS[plan.current_phase_id];
  const currentPhase = plan.phases.find((p) => p.id === plan.current_phase_id);
  const sortedTrialEvents = [...plan.trial_events].sort((a, b) =>
    a.target_date.localeCompare(b.target_date)
  );
  const nextPlannedId = sortedTrialEvents.find((e) => e.status === "planned")?.id;
  const totalSeasonDays = daysBetween(plan.start_date, plan.event_date);

  return (
    <AppShell active="season" athleteEmail={session?.user.email ?? ""} onSignOut={signOut}>
      <div className="mb-5">
        <div className="eyebrow">
          {plan.target_event} · {formatDate(plan.event_date)}
        </div>
        <h1 className="page-title">Season plan</h1>
        <p className="page-sub">
          A {weeksBetween(plan.start_date, plan.event_date)} macrocycle built
          around the event&apos;s own limiters, with a coach-designed
          trial-event ladder rehearsing durability, fueling and terrain at
          increasing fidelity.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-3.5">
        <div className="stat">
          <div className="stat-label">Days to event</div>
          <div className="stat-value mono">{Math.max(days, 0)}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Current phase</div>
          <div className="stat-value">{currentPhaseLabel}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Season span</div>
          <div className="stat-value text-base">
            {formatDate(plan.start_date)} → {formatDate(plan.event_date)} ·{" "}
            {weeksBetween(plan.start_date, plan.event_date)}
          </div>
        </div>
        <div className="stat">
          <div className="stat-label">Deload length</div>
          <div className="stat-value text-base">
            {plan.deload_weeks} week{plan.deload_weeks === 1 ? "" : "s"} / block
          </div>
        </div>
      </div>

      <h2 className="mb-2.5 text-[15px] font-bold">Phases</h2>
      <div className="phase-track mb-2">
        {plan.phases.map((phase) => (
          <PhaseSegment
            key={phase.id}
            phase={phase}
            widthPct={(daysBetween(phase.start_date, phase.end_date) / totalSeasonDays) * 100}
            isCurrent={phase.id === plan.current_phase_id}
          />
        ))}
      </div>
      <p className="mb-6 text-xs" style={{ color: "var(--ink-faint)" }}>
        Only the current phase is planned week-by-week — later phases stay a
        dated summary until the athlete reaches them.
      </p>

      <h2 className="mb-2.5 text-[15px] font-bold">Trial-event ladder</h2>
      {sortedTrialEvents.length === 0 ? (
        <p className="page-sub mb-6">No trial events on the ladder.</p>
      ) : (
        <div className="mb-6 flex flex-col gap-2.5">
          {sortedTrialEvents.map((event) => (
            <TrialEventRung
              key={event.id}
              event={event}
              isNextUp={event.id === nextPlannedId}
            />
          ))}
        </div>
      )}

      {currentPhase && (
        <div className="card p-4 px-5">
          <h2 className="mb-1.5 text-[14.5px] font-bold">
            Current phase — {currentPhase.label}
          </h2>
          <p className="mb-1 text-[13px]" style={{ color: "var(--ink-soft)" }}>
            {formatDate(currentPhase.start_date)} – {formatDate(currentPhase.end_date)}
          </p>
          <p className="mb-2.5 text-[13.5px] leading-relaxed">{currentPhase.focus}</p>
          <Link href="/plan" className="inline-flex items-center gap-1 text-[13px] font-semibold">
            This week&apos;s plan <IconChevronRight />
          </Link>
        </div>
      )}
    </AppShell>
  );
}

function PhaseSegment({
  phase,
  widthPct,
  isCurrent,
}: {
  phase: SeasonPlanPhase;
  widthPct: number;
  isCurrent: boolean;
}) {
  const style = PHASE_STYLE[phase.id] ?? { bg: "var(--line-soft)", color: "var(--ink-soft)" };

  return (
    <div
      className="phase-seg"
      style={{ width: `${widthPct}%`, background: style.bg, color: style.color }}
    >
      {isCurrent && (
        <div
          className="absolute -top-[26px] left-1/2 -translate-x-1/2 text-[10.5px] font-bold whitespace-nowrap"
          style={{ color: "var(--brand-strong)" }}
        >
          ▼ you are here
        </div>
      )}
      <div className="phase-seg-inner">
        <span className="label">{phase.label}</span>
        <span className="sub">
          {formatDate(phase.start_date)}–{formatDate(phase.end_date)}
        </span>
      </div>
    </div>
  );
}

function TrialEventRung({ event, isNextUp }: { event: TrialEvent; isNextUp: boolean }) {
  const isCurrent = event.status === "planned" && isNextUp;
  const badgeRole = event.status === "logged" ? outcomeBadgeRole(event) : null;

  return (
    <div
      className="rung"
      style={
        isCurrent
          ? { borderColor: "var(--brand)", boxShadow: "0 0 0 1px var(--brand)" }
          : event.status === "planned" && !isNextUp
            ? { opacity: 0.7 }
            : undefined
      }
    >
      <div
        className="rung-id"
        style={isCurrent ? { background: "var(--brand)", color: "#fff" } : undefined}
      >
        {event.id.toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-sm font-semibold">
            Category {event.category} · {formatDate(event.target_date)} ·{" "}
            {SEASON_PHASE_LABELS[event.phase_id]}
          </span>
          {event.status === "logged" ? (
            <span className={`badge badge-${badgeRole}`}>Logged</span>
          ) : isCurrent ? (
            <span className="badge badge-brand">Next up</span>
          ) : (
            <span className="badge badge-neutral">Planned</span>
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {specChips(event.spec).map((chip) => (
            <span key={chip} className="spec-chip">
              {chip}
            </span>
          ))}
        </div>
        {event.outcome && (
          <p className="mt-2 text-[12.5px]" style={{ color: "var(--ink-soft)" }}>
            {TRIAL_EVENT_COMPLETION_STATUS_LABELS[event.outcome.completion_status]}
            {" — "}
            {TRIAL_EVENT_FUELING_SIGNAL_LABELS[event.outcome.fueling_signal]}
            {event.outcome.notes ? `. ${event.outcome.notes}` : "."}
          </p>
        )}
      </div>
    </div>
  );
}
