"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import {
  DAY_ORDER,
  SESSION_STATUSES,
  SESSION_STATUS_LABELS,
  isStrengthTarget,
  type CoachNote,
  type Event,
  type Plan,
  type SessionStatus,
  type StrengthWorkoutTarget,
  type Workout,
  type WorkoutLog,
} from "@/lib/types";
import { AppShell } from "../components/AppShell";
import { Centered } from "../components/Centered";
import { StatusBadge } from "../components/StatusBadge";

function daysUntil(dateStr: string): number {
  const today = new Date(new Date().toISOString().slice(0, 10));
  const target = new Date(dateStr);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

function isToday(day: Workout["day"]): boolean {
  const jsDay = new Date().getDay();
  const dayIndex = jsDay === 0 ? 6 : jsDay - 1;
  return DAY_ORDER[dayIndex] === day;
}

function dateForDay(weekStartDate: string, day: Workout["day"]): Date {
  const start = new Date(weekStartDate);
  const date = new Date(start);
  date.setDate(start.getDate() + DAY_ORDER.indexOf(day));
  return date;
}

function phaseLabel(plan: Plan): string {
  if (!plan.phase) return "";
  const label = plan.phase[0].toUpperCase() + plan.phase.slice(1);
  return plan.deload ? `${label} · Deload` : label;
}

function EventCountdownCard({ event, plan }: { event: Event; plan: Plan | null }) {
  const days = daysUntil(event.event_date);
  const name = event.event_name ?? event.event_key ?? "your event";

  return (
    <div className="card mb-5 flex flex-wrap items-center justify-between gap-5 p-5 nav:p-6">
      <div className="flex items-baseline gap-3.5">
        <span className="mono text-4xl leading-none font-semibold">
          {days >= 0 ? days : 0}
        </span>
        <div className="flex flex-col">
          <span className="text-sm font-semibold">days to {name}</span>
          {event.notes && (
            <span className="text-[12.5px] text-[var(--ink-soft)]">{event.notes}</span>
          )}
        </div>
      </div>
      {plan?.phase && <span className="badge badge-brand">{phaseLabel(plan)}</span>}
    </div>
  );
}

// B7 taper/race-week view. Windows are this session's explicit reading of
// macrocycle-model.md's "Refine's final block is race week itself" (no
// stored sub-phase field exists to read instead): the final 7 days before
// and including eventDate are "race week"; the 7 days before that are
// "taper". Both are absent from the DOM outside their window.
function TaperBanner({ event }: { event: Event }) {
  const days = daysUntil(event.event_date);
  if (days < 0 || days > 13) return null;

  const isRaceWeek = days <= 6;
  const name = event.event_name ?? event.event_key ?? "your event";

  return (
    <div
      className="card mb-4 p-3.5"
      style={{
        borderColor: isRaceWeek ? "var(--critical)" : "var(--warning)",
        background: isRaceWeek ? "var(--critical-tint)" : "var(--warning-tint)",
      }}
    >
      <strong style={{ color: isRaceWeek ? "var(--critical)" : "var(--warning)" }}>
        {isRaceWeek ? "Race week" : "Taper"}
      </strong>{" "}
      — {days} day{days === 1 ? "" : "s"} to {name}.{" "}
      {isRaceWeek
        ? "Final rest and fueling prep — this is not a training week."
        : "Reduce volume and back-to-back load while keeping one shorter sharpening session."}
    </div>
  );
}

type LoadState = "loading" | "no-session" | "no-plan" | "ready" | "error";

export default function PlanPage() {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [nextPlan, setNextPlan] = useState<Plan | null>(null);
  const [viewingNextWeek, setViewingNextWeek] = useState(false);
  const [event, setEvent] = useState<Event | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [latestLogByWorkout, setLatestLogByWorkout] = useState<
    Record<string, WorkoutLog>
  >({});
  const [savingWorkoutId, setSavingWorkoutId] = useState<string | null>(null);
  const [coachNotes, setCoachNotes] = useState<CoachNote[]>([]);

  // Loads the workouts/logs/coach-notes for whichever plan is on screen --
  // shared by the initial current-week load and the this-week/next-week
  // toggle, so switching weeks never re-fetches plans/events.
  const loadWeek = useCallback(async (selectedPlan: Plan) => {
    const { data: workoutRows, error: workoutError } = await supabase
      .from("workouts")
      .select("*")
      .eq("plan_id", selectedPlan.id);

    if (workoutError) {
      setErrorMessage(workoutError.message);
      setLoadState("error");
      return;
    }

    const sorted = [...(workoutRows ?? [])].sort(
      (a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day)
    );
    setWorkouts(sorted);
    setLatestLogByWorkout({});

    if (sorted.length > 0) {
      const { data: logRows, error: logError } = await supabase
        .from("workout_logs")
        .select("*")
        .in("workout_id", sorted.map((w) => w.id))
        .order("created_at", { ascending: false });

      if (!logError && logRows) {
        const latest: Record<string, WorkoutLog> = {};
        for (const log of logRows) {
          if (!latest[log.workout_id]) latest[log.workout_id] = log;
        }
        setLatestLogByWorkout(latest);
      }
    }
  }, []);

  const loadPlan = useCallback(async (athleteId: string) => {
    const today = new Date().toISOString().slice(0, 10);

    const [{ data: currentRows, error: currentError }, { data: nextRows }] =
      await Promise.all([
        supabase
          .from("plans")
          .select("*")
          .eq("athlete_id", athleteId)
          .lte("week_start_date", today)
          .order("week_start_date", { ascending: false })
          .limit(1),
        supabase
          .from("plans")
          .select("*")
          .eq("athlete_id", athleteId)
          .gt("week_start_date", today)
          .order("week_start_date", { ascending: true })
          .limit(1),
      ]);

    if (currentError) {
      setErrorMessage(currentError.message);
      setLoadState("error");
      return;
    }

    const currentPlan = currentRows?.[0] ?? null;
    if (!currentPlan) {
      setLoadState("no-plan");
      return;
    }
    setPlan(currentPlan);
    setNextPlan(nextRows?.[0] ?? null);
    setViewingNextWeek(false);

    const { data: eventRows } = await supabase
      .from("events")
      .select("*")
      .eq("athlete_id", athleteId)
      .limit(1);
    setEvent(eventRows?.[0] ?? null);

    await loadWeek(currentPlan);

    const { data: noteRows } = await supabase
      .from("coach_notes")
      .select("*")
      .eq("athlete_id", athleteId)
      .order("created_at", { ascending: false })
      .limit(10);
    setCoachNotes(noteRows ?? []);

    setLoadState("ready");
  }, [loadWeek]);

  function switchWeek(showNextWeek: boolean) {
    const target = showNextWeek ? nextPlan : plan;
    if (!target) return;
    setViewingNextWeek(showNextWeek);
    loadWeek(target);
  }

  // WC3: opening the web app is itself an athlete-triggered moment (per
  // whoop-integration-plan.md's non-goals), so a WHOOP sync fires here when
  // a connection exists -- non-blocking, and only ever fired for an athlete
  // who has actually connected WHOOP (no behavior change otherwise).
  const triggerWhoopSyncIfConnected = useCallback(
    async (athleteId: string, accessToken: string) => {
      const { data: connection } = await supabase
        .from("integration_connections")
        .select("id")
        .eq("athlete_id", athleteId)
        .eq("provider", "whoop")
        .is("revoked_at", null)
        .maybeSingle();

      if (!connection) return;

      try {
        await fetch("/api/whoop/sync", {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      } catch {
        // Non-blocking: today's plan is already rendered from data already
        // loaded; a sync failure here just means the WHOOP-sourced rows
        // stay as fresh as the last successful sync.
      }
    },
    []
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        setLoadState("no-session");
        return;
      }
      setSession(data.session);
      loadPlan(data.session.user.id);
      triggerWhoopSyncIfConnected(data.session.user.id, data.session.access_token);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        if (newSession) {
          loadPlan(newSession.user.id);
          triggerWhoopSyncIfConnected(newSession.user.id, newSession.access_token);
        } else {
          setLoadState("no-session");
        }
      }
    );

    return () => subscription.subscription.unsubscribe();
  }, [loadPlan, triggerWhoopSyncIfConnected]);

  async function logWorkout(workoutId: string, status: SessionStatus) {
    if (!session) return;
    setSavingWorkoutId(workoutId);

    const { data, error } = await supabase
      .from("workout_logs")
      .insert({
        workout_id: workoutId,
        athlete_id: session.user.id,
        status,
        source: "web-ui",
      })
      .select()
      .single();

    setSavingWorkoutId(null);

    if (error) {
      setErrorMessage(error.message);
      return;
    }
    if (data) {
      setLatestLogByWorkout((prev) => ({ ...prev, [workoutId]: data }));
    }
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

  if (loadState === "no-plan") {
    return (
      <Centered>
        <p>
          No plan has been generated yet for this week. Run a planning session
          with your coach first.
        </p>
        <button onClick={signOut} className="btn btn-ghost justify-self-center">
          Sign out
        </button>
      </Centered>
    );
  }

  const displayedPlan = viewingNextWeek ? nextPlan : plan;

  const athleteSub =
    displayedPlan?.rider_type || displayedPlan?.ftp_used
      ? [
          displayedPlan.rider_type
            ? displayedPlan.rider_type[0].toUpperCase() + displayedPlan.rider_type.slice(1)
            : null,
          displayedPlan.ftp_used ? `FTP ${displayedPlan.ftp_used}W` : null,
        ]
          .filter(Boolean)
          .join(" · ")
      : undefined;

  return (
    <AppShell
      active="plan"
      athleteEmail={session?.user.email ?? ""}
      athleteSub={athleteSub}
      brandSub={event ? `${event.event_name ?? event.event_key} · ${event.event_date}` : undefined}
      onSignOut={signOut}
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="eyebrow">Week of {displayedPlan?.week_start_date}</div>
          <h1 className="page-title">
            {viewingNextWeek ? "Next week's plan" : "This week's plan"}
          </h1>
          {displayedPlan?.focus && <p className="page-sub">{displayedPlan.focus}</p>}
        </div>
        {nextPlan && (
          <div className="flex gap-1.5">
            <button
              className={`btn btn-sm ${!viewingNextWeek ? "btn-primary" : "btn-ghost"}`}
              onClick={() => switchWeek(false)}
            >
              This week
            </button>
            <button
              className={`btn btn-sm ${viewingNextWeek ? "btn-primary" : "btn-ghost"}`}
              onClick={() => switchWeek(true)}
            >
              Next week
            </button>
          </div>
        )}
      </div>

      {!viewingNextWeek && event && <TaperBanner event={event} />}
      {!viewingNextWeek && event && <EventCountdownCard event={event} plan={displayedPlan} />}

      {!event && displayedPlan && (
        <p className="page-sub mb-5">
          {!displayedPlan.phase ? "" : `${displayedPlan.phase} phase`}
          {displayedPlan.deload ? " (deload)" : ""}
        </p>
      )}

      <div className="flex flex-col gap-2.5">
        {workouts.map((workout) => (
          <WorkoutRow
            key={workout.id}
            workout={workout}
            weekStartDate={displayedPlan?.week_start_date ?? ""}
            allowTodayBadge={!viewingNextWeek}
            latestLog={latestLogByWorkout[workout.id]}
            saving={savingWorkoutId === workout.id}
            onLog={(status) => logWorkout(workout.id, status)}
          />
        ))}
        {workouts.length === 0 && (
          <p className="page-sub">
            No workouts scheduled {viewingNextWeek ? "next week" : "this week"}.
          </p>
        )}
      </div>

      {coachNotes.length > 0 && (
        <section className="mt-7">
          <h2 className="mb-3 text-[15px] font-bold">Coach notes</h2>
          <div className="flex flex-col gap-2">
            {coachNotes.map((note) => (
              <CoachNoteCard key={note.id} note={note} />
            ))}
          </div>
        </section>
      )}
    </AppShell>
  );
}

function CoachNoteCard({ note }: { note: CoachNote }) {
  return (
    <div className="card p-3 px-4">
      <div className="mb-1 text-[11.5px] text-[var(--ink-faint)]">
        {note.workout_log_id ? "Bike session" : "Strength session"} ·{" "}
        {new Date(note.created_at).toLocaleDateString()}
      </div>
      <p className="m-0 text-[13.5px] leading-relaxed">{note.note}</p>
    </div>
  );
}

function formatTargetKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());
}

function formatTargetValue(value: unknown): string {
  if (typeof value === "object" && value !== null) return JSON.stringify(value);
  return String(value);
}

// Bike sessions carry freeform target JSON (no fixed schema, per SKILL.md
// Step 7 item 5), so this renders whatever primitive keys the skill wrote
// rather than assuming a specific set (% FTP, watts, duration, etc. all vary
// by archetype).
function BikeTargetChips({ target }: { target: Record<string, unknown> }) {
  const entries = Object.entries(target).filter(([, value]) => {
    if (value === null || value === undefined) return false;
    if (typeof value === "string" && value.trim() === "") return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  });
  if (entries.length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {entries.map(([key, value]) => (
        <span key={key} className="target-chip">
          {formatTargetKey(key)}: {formatTargetValue(value)}
        </span>
      ))}
    </div>
  );
}

function StrengthExerciseTable({ target }: { target: StrengthWorkoutTarget }) {
  if (target.exercises.length === 0) return null;
  return (
    <div className="mt-2">
      <table className="table">
        <thead>
          <tr>
            <th>Exercise</th>
            <th>Sets × reps</th>
            <th>Load / cue</th>
            <th>Rest</th>
          </tr>
        </thead>
        <tbody>
          {target.exercises.map((entry, index) => (
            <tr key={index}>
              <td>{entry.exercise}</td>
              <td>{entry.sets_reps}</td>
              <td>{entry.load_cue}</td>
              <td>{entry.rest}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {target.session_file && (
        <p className="mt-1 text-[12px]" style={{ color: "var(--ink-faint)" }}>
          Full session: {target.session_file}
        </p>
      )}
    </div>
  );
}

function WorkoutRow({
  workout,
  weekStartDate,
  allowTodayBadge,
  latestLog,
  saving,
  onLog,
}: {
  workout: Workout;
  weekStartDate: string;
  allowTodayBadge: boolean;
  latestLog: WorkoutLog | undefined;
  saving: boolean;
  onLog: (status: SessionStatus) => void;
}) {
  const [selected, setSelected] = useState<SessionStatus>(
    latestLog?.status ?? "completed_as_planned"
  );
  const today = allowTodayBadge && isToday(workout.day);
  const strengthTarget = isStrengthTarget(workout.target) ? workout.target : null;

  return (
    <div className={`workout-row flex flex-wrap items-start gap-3.5${today ? " today" : ""}`}>
      <div className={`day-chip${today ? " today" : ""}`}>
        <span className="d">{workout.day}</span>
        <span className="n">{dateForDay(weekStartDate, workout.day).getDate()}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[14.5px] font-semibold">{workout.archetype}</span>
          {today && <span className="badge badge-brand px-2 py-0.5">Today</span>}
        </div>
        {strengthTarget ? (
          <StrengthExerciseTable target={strengthTarget} />
        ) : (
          <BikeTargetChips target={workout.target as Record<string, unknown>} />
        )}
        {latestLog && (
          <div className="mt-1.5">
            <StatusBadge status={latestLog.status} />
          </div>
        )}
      </div>
      <div className="flex w-full items-center gap-2 nav:w-auto nav:shrink-0">
        <select
          className="select flex-1 nav:flex-none"
          value={selected}
          onChange={(event) => setSelected(event.target.value as SessionStatus)}
        >
          {SESSION_STATUSES.map((status) => (
            <option key={status} value={status}>
              {SESSION_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
        <button
          disabled={saving}
          onClick={() => onLog(selected)}
          className="btn btn-primary btn-sm shrink-0"
        >
          {saving ? "Saving…" : latestLog ? "Update" : "Log"}
        </button>
      </div>
    </div>
  );
}
