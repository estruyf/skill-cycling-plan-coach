"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import {
  DAY_ORDER,
  SESSION_STATUSES,
  SESSION_STATUS_LABELS,
  isStrengthTarget,
  type ExerciseEntry,
  type SessionStatus,
  type StrengthLog,
  type Workout,
} from "@/lib/types";
import { AppShell } from "../components/AppShell";
import { Centered } from "../components/Centered";
import { StatusBadge } from "../components/StatusBadge";
import { IconPlus, IconTrash } from "../components/icons";

type LoadState = "loading" | "no-session" | "ready" | "error";

const EMPTY_EXERCISE: ExerciseEntry = {
  exercise: "",
  sets: null,
  reps: null,
  load_kg: null,
};

export default function StrengthPage() {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [logs, setLogs] = useState<StrengthLog[]>([]);
  const [prescribed, setPrescribed] = useState<Workout[]>([]);
  const [saving, setSaving] = useState(false);

  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);
  const [sessionName, setSessionName] = useState("");
  const [status, setStatus] = useState<SessionStatus>("completed_as_planned");
  const [exercises, setExercises] = useState<ExerciseEntry[]>([
    { ...EMPTY_EXERCISE },
  ]);
  const [notes, setNotes] = useState("");

  const loadLogs = useCallback(async (athleteId: string) => {
    const { data, error } = await supabase
      .from("strength_logs")
      .select("*")
      .eq("athlete_id", athleteId)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      setErrorMessage(error.message);
      setLoadState("error");
      return;
    }

    setLogs(data ?? []);
    setLoadState("ready");
  }, []);

  // Surfaces what the coach actually prescribed for this week's strength/
  // core day(s) -- without this, the log form below is blind: the athlete
  // has to already know their exercises from elsewhere to fill it in.
  const loadPrescribed = useCallback(async (athleteId: string) => {
    const today = new Date().toISOString().slice(0, 10);

    const { data: plans } = await supabase
      .from("plans")
      .select("id")
      .eq("athlete_id", athleteId)
      .lte("week_start_date", today)
      .order("week_start_date", { ascending: false })
      .limit(1);

    const planId = plans?.[0]?.id;
    if (!planId) {
      setPrescribed([]);
      return;
    }

    const { data: workoutRows } = await supabase
      .from("workouts")
      .select("*")
      .eq("plan_id", planId)
      .eq("target->>type", "strength");

    const sorted = [...(workoutRows ?? [])].sort(
      (a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day)
    );
    setPrescribed(sorted);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        setLoadState("no-session");
        return;
      }
      setSession(data.session);
      loadLogs(data.session.user.id);
      loadPrescribed(data.session.user.id);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        if (newSession) {
          loadLogs(newSession.user.id);
          loadPrescribed(newSession.user.id);
        } else {
          setLoadState("no-session");
        }
      }
    );

    return () => subscription.subscription.unsubscribe();
  }, [loadLogs, loadPrescribed]);

  function resetForm() {
    setSelectedWorkoutId(null);
    setSessionName("");
    setStatus("completed_as_planned");
    setExercises([{ ...EMPTY_EXERCISE }]);
    setNotes("");
  }

  // Parses a prescribed "4 x 5" / "3 x 8 / leg" string into starting
  // sets/reps for the log form -- best-effort only; the athlete edits to
  // reflect what they actually did. Left null when the shape doesn't match
  // a plain "N x M" (e.g. a duration-based core hold like "3 x 45 s").
  function parsePrescribedSetsReps(setsReps: string): { sets: number | null; reps: number | null } {
    const match = setsReps.match(/^(\d+)\s*x\s*(\d+)/i);
    if (!match) return { sets: null, reps: null };
    return { sets: Number(match[1]), reps: Number(match[2]) };
  }

  function logAgainstPrescribed(workout: Workout) {
    if (!isStrengthTarget(workout.target)) return;
    setSelectedWorkoutId(workout.id);
    setSessionName(workout.archetype);
    setStatus("completed_as_planned");
    setExercises(
      workout.target.exercises.map((entry) => ({
        exercise: entry.exercise,
        load_kg: null,
        ...parsePrescribedSetsReps(entry.sets_reps),
      }))
    );
    setNotes("");
    if (typeof window !== "undefined") {
      document.getElementById("session-name")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function updateExercise(
    index: number,
    field: keyof ExerciseEntry,
    value: string
  ) {
    setExercises((prev) =>
      prev.map((entry, i) => {
        if (i !== index) return entry;
        if (field === "exercise") {
          return { ...entry, exercise: value };
        }
        return { ...entry, [field]: value === "" ? null : Number(value) };
      })
    );
  }

  function addExerciseRow() {
    setExercises((prev) => [...prev, { ...EMPTY_EXERCISE }]);
  }

  function removeExerciseRow(index: number) {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) return;
    setSaving(true);
    setErrorMessage("");

    const cleanedExercises = exercises.filter((entry) => entry.exercise.trim() !== "");

    const { data, error } = await supabase
      .from("strength_logs")
      .insert({
        athlete_id: session.user.id,
        workout_id: selectedWorkoutId,
        session_name: sessionName,
        status,
        sets_reps_load: { exercises: cleanedExercises },
        notes,
      })
      .select()
      .single();

    setSaving(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    if (data) {
      setLogs((prev) => [data, ...prev]);
    }
    resetForm();
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

  return (
    <AppShell active="strength" athleteEmail={session?.user.email ?? ""} onSignOut={signOut}>
      <div className="mb-5">
        <div className="eyebrow">Gym sessions</div>
        <h1 className="page-title">Strength log</h1>
        <p className="page-sub">
          Log sets, reps and load for each prescribed strength session.
        </p>
      </div>

      {prescribed.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2.5 text-[15px] font-bold">Prescribed this week</h2>
          <div className="flex flex-col gap-2.5">
            {prescribed.map((workout) => (
              <PrescribedCard
                key={workout.id}
                workout={workout}
                selected={selectedWorkoutId === workout.id}
                onLog={() => logAgainstPrescribed(workout)}
              />
            ))}
          </div>
        </section>
      )}

      <form onSubmit={handleSubmit} className="card mb-7 p-5 nav:p-6">
        <div className="mb-4 grid grid-cols-1 gap-3.5 nav:grid-cols-[2fr_1fr]">
          <div className="field">
            <label htmlFor="session-name">Session name</label>
            <input
              id="session-name"
              className="input"
              type="text"
              placeholder="e.g. Max-strength lower body"
              value={sessionName}
              onChange={(event) => setSessionName(event.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              className="select"
              value={status}
              onChange={(event) => setStatus(event.target.value as SessionStatus)}
            >
              {SESSION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {SESSION_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-2 text-xs font-semibold text-[var(--ink-soft)]">Exercises</div>
        <div className="mb-3 flex flex-col gap-2">
          {exercises.map((entry, index) => (
            <div key={index} className="exercise-row">
              <input
                type="text"
                placeholder="Exercise"
                className="input"
                value={entry.exercise}
                onChange={(event) => updateExercise(index, "exercise", event.target.value)}
              />
              <input
                type="number"
                min="0"
                placeholder="Sets"
                className="input"
                value={entry.sets ?? ""}
                onChange={(event) => updateExercise(index, "sets", event.target.value)}
              />
              <input
                type="number"
                min="0"
                placeholder="Reps"
                className="input"
                value={entry.reps ?? ""}
                onChange={(event) => updateExercise(index, "reps", event.target.value)}
              />
              <input
                type="number"
                min="0"
                step="0.5"
                placeholder="kg"
                className="input"
                value={entry.load_kg ?? ""}
                onChange={(event) => updateExercise(index, "load_kg", event.target.value)}
              />
              <button
                type="button"
                className="btn-icon"
                onClick={() => removeExerciseRow(index)}
                disabled={exercises.length === 1}
                title="Remove"
              >
                <IconTrash />
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addExerciseRow} className="btn btn-ghost btn-sm mb-4">
          <IconPlus />
          Add exercise
        </button>

        <div className="field mb-4">
          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            className="input"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={2}
            placeholder="How did it feel?"
          />
        </div>

        <button type="submit" disabled={saving} className="btn btn-primary">
          {saving ? "Saving…" : "Log session"}
        </button>
        {errorMessage && (
          <p className="mt-3 text-sm" style={{ color: "var(--critical)" }}>
            {errorMessage}
          </p>
        )}
      </form>

      <h2 className="mb-2.5 text-[15px] font-bold">History</h2>
      <div className="flex flex-col gap-2.5">
        {logs.map((log) => (
          <StrengthLogCard key={log.id} log={log} />
        ))}
        {logs.length === 0 && <p className="page-sub">No strength sessions logged yet.</p>}
      </div>
    </AppShell>
  );
}

function PrescribedCard({
  workout,
  selected,
  onLog,
}: {
  workout: Workout;
  selected: boolean;
  onLog: () => void;
}) {
  if (!isStrengthTarget(workout.target)) return null;
  const { exercises, session_file } = workout.target;

  return (
    <div className={`card p-3.5 px-4.5${selected ? " ring-2 ring-[var(--brand)]" : ""}`}>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">
            {workout.day}
          </span>{" "}
          <strong className="text-sm">{workout.archetype}</strong>
        </div>
        <button type="button" onClick={onLog} className="btn btn-primary btn-sm">
          {selected ? "Editing below" : "Log this session"}
        </button>
      </div>
      {exercises.length > 0 && (
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
            {exercises.map((entry, index) => (
              <tr key={index}>
                <td>{entry.exercise}</td>
                <td>{entry.sets_reps}</td>
                <td>{entry.load_cue}</td>
                <td>{entry.rest}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {session_file && (
        <p className="mt-1 text-[12px]" style={{ color: "var(--ink-faint)" }}>
          Full session: {session_file}
        </p>
      )}
    </div>
  );
}

function StrengthLogCard({ log }: { log: StrengthLog }) {
  return (
    <div className="card p-3.5 px-4.5">
      <div className="mb-2 flex items-baseline justify-between">
        <strong className="text-sm">{log.session_name}</strong>
        <StatusBadge status={log.status} />
      </div>
      {log.sets_reps_load.exercises.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {log.sets_reps_load.exercises.map((entry, index) => (
            <span key={index} className="tag">
              {entry.exercise}
              {entry.sets !== null ? ` · ${entry.sets}×${entry.reps ?? ""}` : ""}
              {entry.load_kg !== null ? ` @ ${entry.load_kg} kg` : ""}
            </span>
          ))}
        </div>
      )}
      {log.notes && (
        <p className="mt-2 text-[12.5px]" style={{ color: "var(--ink-soft)" }}>
          {log.notes}
        </p>
      )}
    </div>
  );
}
