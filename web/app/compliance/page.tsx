"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import {
  SESSION_STATUSES,
  STATUS_ROLE,
  STATUS_ROLE_COLOR,
  STATUS_ROLE_LABELS,
  STATUS_ROLE_ORDER,
  type SessionStatus,
  type StatusRole,
} from "@/lib/types";
import { AppShell } from "../components/AppShell";
import { Centered } from "../components/Centered";

type LoadState = "loading" | "no-session" | "ready" | "error";

type StatusCounts = Record<SessionStatus, number>;

function emptyCounts(): StatusCounts {
  return {
    completed_as_planned: 0,
    completed_easier_than_planned: 0,
    completed_harder_than_planned: 0,
    failed_too_hard: 0,
    skipped: 0,
  };
}

function addStatus(counts: StatusCounts, status: SessionStatus) {
  counts[status] += 1;
}

function total(counts: StatusCounts): number {
  return SESSION_STATUSES.reduce((sum, s) => sum + counts[s], 0);
}

function roleCounts(counts: StatusCounts): Record<StatusRole, number> {
  const roles: Record<StatusRole, number> = {
    good: 0,
    warning: 0,
    serious: 0,
    critical: 0,
  };
  for (const status of SESSION_STATUSES) {
    roles[STATUS_ROLE[status]] += counts[status];
  }
  return roles;
}

// Monday-start ISO 8601 week, matching the week id convention the skill
// already uses for plan filenames (e.g. "2026-W26").
function isoWeekKey(dateStr: string): string {
  const source = new Date(dateStr);
  const d = new Date(
    Date.UTC(source.getFullYear(), source.getMonth(), source.getDate())
  );
  const dayNum = (d.getUTCDay() + 6) % 7; // Mon=0 .. Sun=6
  d.setUTCDate(d.getUTCDate() - dayNum + 3); // nearest Thursday
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const firstDayNum = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNum + 3);
  const weekNum =
    1 + Math.round((d.getTime() - firstThursday.getTime()) / (7 * 86_400_000));
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

interface LoggedEntry {
  status: SessionStatus;
  created_at: string;
}

export default function CompliancePage() {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [athleteEmail, setAthleteEmail] = useState("");
  const [byArchetype, setByArchetype] = useState<Map<string, StatusCounts>>(
    new Map()
  );
  const [byExercise, setByExercise] = useState<Map<string, StatusCounts>>(
    new Map()
  );
  const [byWeek, setByWeek] = useState<Map<string, StatusCounts>>(new Map());

  const loadCompliance = useCallback(async (athleteId: string) => {
    const [{ data: workoutRows, error: workoutError }, { data: strengthRows, error: strengthError }] =
      await Promise.all([
        supabase
          .from("workout_logs")
          .select("status, created_at, workouts(archetype)")
          .eq("athlete_id", athleteId)
          .order("created_at", { ascending: false })
          .limit(300),
        supabase
          .from("strength_logs")
          .select("status, created_at, session_name")
          .eq("athlete_id", athleteId)
          .order("created_at", { ascending: false })
          .limit(300),
      ]);

    if (workoutError || strengthError) {
      setErrorMessage((workoutError ?? strengthError)!.message);
      setLoadState("error");
      return;
    }

    const archetypeMap = new Map<string, StatusCounts>();
    const weekEntries: LoggedEntry[] = [];

    type WorkoutLogJoinRow = {
      status: SessionStatus;
      created_at: string;
      workouts: { archetype: string } | { archetype: string }[] | null;
    };

    for (const row of (workoutRows ?? []) as WorkoutLogJoinRow[]) {
      const joined = Array.isArray(row.workouts) ? row.workouts[0] : row.workouts;
      const archetype = joined?.archetype ?? "Unknown archetype";
      const counts = archetypeMap.get(archetype) ?? emptyCounts();
      addStatus(counts, row.status);
      archetypeMap.set(archetype, counts);
      weekEntries.push({ status: row.status, created_at: row.created_at });
    }

    const exerciseMap = new Map<string, StatusCounts>();
    for (const row of (strengthRows ?? []) as {
      status: SessionStatus;
      created_at: string;
      session_name: string;
    }[]) {
      const counts = exerciseMap.get(row.session_name) ?? emptyCounts();
      addStatus(counts, row.status);
      exerciseMap.set(row.session_name, counts);
      weekEntries.push({ status: row.status, created_at: row.created_at });
    }

    const weekMap = new Map<string, StatusCounts>();
    for (const entry of weekEntries) {
      const key = isoWeekKey(entry.created_at);
      const counts = weekMap.get(key) ?? emptyCounts();
      addStatus(counts, entry.status);
      weekMap.set(key, counts);
    }
    const sortedWeekMap = new Map(
      [...weekMap.entries()].sort(([a], [b]) => a.localeCompare(b))
    );

    setByArchetype(archetypeMap);
    setByExercise(exerciseMap);
    setByWeek(sortedWeekMap);
    setLoadState("ready");
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        setLoadState("no-session");
        return;
      }
      setAthleteEmail(data.session.user.email ?? "");
      loadCompliance(data.session.user.id);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (newSession) {
          setAthleteEmail(newSession.user.email ?? "");
          loadCompliance(newSession.user.id);
        } else {
          setLoadState("no-session");
        }
      }
    );

    return () => subscription.subscription.unsubscribe();
  }, [loadCompliance]);

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

  const hasData = byArchetype.size > 0 || byExercise.size > 0;

  return (
    <AppShell active="compliance" athleteEmail={athleteEmail} onSignOut={signOut}>
      <div className="mb-4">
        <div className="eyebrow">Season to date</div>
        <h1 className="page-title">Compliance &amp; trends</h1>
        <p className="page-sub">How sessions actually went, by session type and by week.</p>
      </div>

      {!hasData && (
        <p className="page-sub">No logged sessions yet — log a workout or strength session first.</p>
      )}

      {hasData && (
        <>
          <StatusLegend />

          <div className="mb-6 grid grid-cols-1 gap-5 nav:grid-cols-2">
            <div className="card p-5">
              <h2 className="mb-3.5 text-sm font-bold">By bike archetype</h2>
              {byArchetype.size === 0 ? (
                <p className="page-sub">No bike sessions logged yet.</p>
              ) : (
                <div className="flex flex-col gap-3.5">
                  {[...byArchetype.entries()].map(([archetype, counts]) => (
                    <NamedBar key={archetype} name={archetype} counts={counts} />
                  ))}
                </div>
              )}
            </div>

            <div className="card p-5">
              <h2 className="mb-3.5 text-sm font-bold">By strength session</h2>
              {byExercise.size === 0 ? (
                <p className="page-sub">No strength sessions logged yet.</p>
              ) : (
                <div className="flex flex-col gap-3.5">
                  {[...byExercise.entries()].map(([name, counts]) => (
                    <NamedBar key={name} name={name} counts={counts} />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card p-5">
            <h2 className="mb-3.5 text-sm font-bold">
              Trend by week — bike + strength combined
            </h2>
            {byWeek.size === 0 ? (
              <p className="page-sub">Not enough logged data yet.</p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {[...byWeek.entries()].map(([week, counts]) => (
                  <NamedBar key={week} name={week} counts={counts} mono showNote={false} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </AppShell>
  );
}

function StatusLegend() {
  return (
    <div className="card mb-6 flex flex-wrap gap-5 p-3 px-4.5">
      {STATUS_ROLE_ORDER.map((role) => (
        <span key={role} className="legend-pill">
          <span className="dot" style={{ background: STATUS_ROLE_COLOR[role] }} />
          {STATUS_ROLE_LABELS[role]}
        </span>
      ))}
    </div>
  );
}

function NamedBar({
  name,
  counts,
  mono = false,
  showNote = true,
}: {
  name: string;
  counts: StatusCounts;
  mono?: boolean;
  showNote?: boolean;
}) {
  const roles = roleCounts(counts);
  const totalCount = total(counts);

  const note = STATUS_ROLE_ORDER.filter((role) => roles[role] > 0)
    .map((role) => `${roles[role]} ${STATUS_ROLE_LABELS[role].toLowerCase()}`)
    .join(" · ");

  return (
    <div>
      <div className="bar-row-label">
        <span className={mono ? "mono" : undefined}>{name}</span>
        <span className="mono" style={{ color: "var(--ink-faint)" }}>
          {totalCount}
        </span>
      </div>
      <div className="segbar">
        {STATUS_ROLE_ORDER.map((role) => {
          const count = roles[role];
          if (count === 0) return null;
          const pct = (count / totalCount) * 100;
          return (
            <div
              key={role}
              title={`${STATUS_ROLE_LABELS[role]}: ${count} (${pct.toFixed(0)}%)`}
              style={{ width: `${pct}%`, background: STATUS_ROLE_COLOR[role] }}
            />
          );
        })}
      </div>
      {showNote && note && <div className="seg-note">{note}</div>}
    </div>
  );
}
