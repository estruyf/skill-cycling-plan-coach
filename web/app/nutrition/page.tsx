"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import {
  CARB_TARGET_STATUSES,
  CARB_TARGET_STATUS_LABELS,
  DAY_ORDER,
  MEAL_RATING_VALUES,
  type CarbTargetStatus,
  type MealFeedback,
  type MealRecommendation,
  type NutritionLog,
} from "@/lib/types";
import { AppShell } from "../components/AppShell";
import { Centered } from "../components/Centered";

type LoadState = "loading" | "no-session" | "ready" | "error";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function NutritionPage() {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [logs, setLogs] = useState<NutritionLog[]>([]);
  const [saving, setSaving] = useState(false);

  const [mealItems, setMealItems] = useState<MealRecommendation[]>([]);
  const [latestFeedbackByMeal, setLatestFeedbackByMeal] = useState<
    Record<string, MealFeedback>
  >({});

  const [logDate, setLogDate] = useState(today());
  const [carbsG, setCarbsG] = useState("");
  const [calories, setCalories] = useState("");
  const [carbTargetStatus, setCarbTargetStatus] =
    useState<CarbTargetStatus>("hit");
  const [hydrationNote, setHydrationNote] = useState("");
  const [bodyWeightKg, setBodyWeightKg] = useState("");
  const [notes, setNotes] = useState("");

  const loadLogs = useCallback(async (athleteId: string) => {
    const { data, error } = await supabase
      .from("nutrition_logs")
      .select("*")
      .eq("athlete_id", athleteId)
      .order("log_date", { ascending: false })
      .limit(30);

    if (error) {
      setErrorMessage(error.message);
      setLoadState("error");
      return;
    }

    setLogs(data ?? []);
    setLoadState("ready");
  }, []);

  // Issue #45: this week's itemized meal recommendations (issue #46), when
  // mealPlanEnabled produced any for the current plan, plus the latest
  // feedback per item (same "latest wins" read-back as plan/page.tsx's
  // workout_logs).
  const loadMeals = useCallback(async (athleteId: string) => {
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
      setMealItems([]);
      return;
    }

    const { data: items } = await supabase
      .from("meal_recommendations")
      .select("*")
      .eq("plan_id", planId)
      .order("created_at", { ascending: true });

    const sorted = [...(items ?? [])].sort(
      (a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day)
    );
    setMealItems(sorted);

    if (sorted.length === 0) return;

    const { data: feedbackRows } = await supabase
      .from("meal_feedback")
      .select("*")
      .in("meal_recommendation_id", sorted.map((item) => item.id))
      .order("created_at", { ascending: false });

    if (feedbackRows) {
      const latest: Record<string, MealFeedback> = {};
      for (const feedback of feedbackRows) {
        if (!latest[feedback.meal_recommendation_id]) {
          latest[feedback.meal_recommendation_id] = feedback;
        }
      }
      setLatestFeedbackByMeal(latest);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        setLoadState("no-session");
        return;
      }
      setSession(data.session);
      loadLogs(data.session.user.id);
      loadMeals(data.session.user.id);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        if (newSession) {
          loadLogs(newSession.user.id);
          loadMeals(newSession.user.id);
        } else {
          setLoadState("no-session");
        }
      }
    );

    return () => subscription.subscription.unsubscribe();
  }, [loadLogs, loadMeals]);

  async function submitMealFeedback(
    mealRecommendationId: string,
    feedback: { rating: number; wantsChanged: boolean; comment: string }
  ) {
    if (!session) return;

    const { data, error } = await supabase
      .from("meal_feedback")
      .insert({
        athlete_id: session.user.id,
        meal_recommendation_id: mealRecommendationId,
        rating: feedback.rating,
        wants_changed: feedback.wantsChanged,
        comment: feedback.comment,
        source: "web-ui",
      })
      .select()
      .single();

    if (error) {
      setErrorMessage(error.message);
      return;
    }
    if (data) {
      setLatestFeedbackByMeal((prev) => ({ ...prev, [mealRecommendationId]: data }));
    }
  }

  const stats = useMemo(() => {
    const recent = logs.slice(0, 7);
    const withCarbs = recent.filter((l) => l.carbs_g !== null);
    const avgCarbs =
      withCarbs.length > 0
        ? Math.round(
            withCarbs.reduce((sum, l) => sum + (l.carbs_g ?? 0), 0) / withCarbs.length
          )
        : null;
    const withTarget = recent.filter((l) => l.carb_target_status !== null);
    const hitCount = withTarget.filter((l) => l.carb_target_status === "hit").length;
    const latestWeight = logs.find((l) => l.body_weight_kg !== null)?.body_weight_kg ?? null;

    return {
      avgCarbs,
      hitRate: withTarget.length > 0 ? `${hitCount} / ${withTarget.length} days` : "—",
      latestWeight,
    };
  }, [logs]);

  function resetForm() {
    setLogDate(today());
    setCarbsG("");
    setCalories("");
    setCarbTargetStatus("hit");
    setHydrationNote("");
    setBodyWeightKg("");
    setNotes("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) return;
    setSaving(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("nutrition_logs")
      .upsert(
        {
          athlete_id: session.user.id,
          log_date: logDate,
          carbs_g: carbsG === "" ? null : Number(carbsG),
          calories: calories === "" ? null : Number(calories),
          carb_target_status: carbTargetStatus,
          hydration_note: hydrationNote,
          body_weight_kg: bodyWeightKg === "" ? null : Number(bodyWeightKg),
          notes,
        },
        { onConflict: "athlete_id,log_date" }
      )
      .select()
      .single();

    setSaving(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    if (data) {
      setLogs((prev) => {
        const withoutSameDay = prev.filter((log) => log.id !== data.id);
        return [data, ...withoutSameDay].sort((a, b) =>
          a.log_date < b.log_date ? 1 : -1
        );
      });
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
    <AppShell active="nutrition" athleteEmail={session?.user.email ?? ""} onSignOut={signOut}>
      <div className="mb-5">
        <div className="eyebrow">Daily fueling</div>
        <h1 className="page-title">Nutrition log</h1>
        <p className="page-sub">
          Carbs, calories, hydration and body weight — the fueling ramp the
          coach reads back into your plan.
        </p>
      </div>

      {mealItems.length > 0 && (
        <section className="mb-7">
          <h2 className="mb-2.5 text-[15px] font-bold">This week&apos;s meals</h2>
          <p className="page-sub mb-3">
            Rate any item — the coach reads it back to swap out what didn&apos;t
            work next time.
          </p>
          <div className="flex flex-col gap-4">
            {DAY_ORDER.filter((day) =>
              mealItems.some((item) => item.day === day)
            ).map((day) => (
              <div key={day}>
                <div className="mb-1.5 text-[12.5px] font-bold text-[var(--ink-soft)]">
                  {day}
                </div>
                <div className="flex flex-col gap-2">
                  {mealItems
                    .filter((item) => item.day === day)
                    .map((item) => (
                      <MealItemRow
                        key={item.id}
                        item={item}
                        latestFeedback={latestFeedbackByMeal[item.id]}
                        onSubmit={(feedback) => submitMealFeedback(item.id, feedback)}
                      />
                    ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="mb-6 flex flex-wrap gap-3.5">
        <div className="stat">
          <div className="stat-label">7-day avg carbs</div>
          <div className="stat-value mono">
            {stats.avgCarbs !== null ? `${stats.avgCarbs} g` : "—"}
          </div>
        </div>
        <div className="stat">
          <div className="stat-label">Target hit rate</div>
          <div className="stat-value mono">{stats.hitRate}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Latest weight</div>
          <div className="stat-value mono">
            {stats.latestWeight !== null ? `${stats.latestWeight} kg` : "—"}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card mb-7 p-5 nav:p-6">
        <h2 className="mb-3.5 text-[14.5px] font-bold">Log today</h2>
        <div className="mb-3.5 grid grid-cols-2 gap-3.5 nav:grid-cols-5">
          <div className="field">
            <label htmlFor="log-date">Date</label>
            <input
              id="log-date"
              className="input"
              type="date"
              value={logDate}
              max={today()}
              onChange={(event) => setLogDate(event.target.value)}
              required
            />
          </div>
          <div className="field nav:col-span-2">
            <label>Carb target</label>
            <div className="seg">
              {CARB_TARGET_STATUSES.map((status) => (
                <button
                  key={status}
                  type="button"
                  className={carbTargetStatus === status ? "on" : ""}
                  onClick={() => setCarbTargetStatus(status)}
                >
                  {CARB_TARGET_STATUS_LABELS[status].replace(" carb target", "")}
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <label htmlFor="carbs">Carbs (g)</label>
            <input
              id="carbs"
              className="input"
              type="number"
              min="0"
              value={carbsG}
              onChange={(event) => setCarbsG(event.target.value)}
              placeholder="0"
            />
          </div>
          <div className="field">
            <label htmlFor="calories">Calories</label>
            <input
              id="calories"
              className="input"
              type="number"
              min="0"
              value={calories}
              onChange={(event) => setCalories(event.target.value)}
              placeholder="0"
            />
          </div>
        </div>

        <div className="mb-3.5 grid grid-cols-1 gap-3.5 nav:grid-cols-[2fr_1fr]">
          <div className="field">
            <label htmlFor="hydration">Hydration note</label>
            <input
              id="hydration"
              className="input"
              type="text"
              placeholder="e.g. felt dehydrated by the last hour"
              value={hydrationNote}
              onChange={(event) => setHydrationNote(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="weight">Body weight (kg)</label>
            <input
              id="weight"
              className="input"
              type="number"
              min="0"
              step="0.1"
              value={bodyWeightKg}
              onChange={(event) => setBodyWeightKg(event.target.value)}
            />
          </div>
        </div>

        <div className="field mb-4">
          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            className="input"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={2}
            placeholder="Anything the coach should know"
          />
        </div>

        <button type="submit" disabled={saving} className="btn btn-primary">
          {saving ? "Saving…" : "Log day"}
        </button>
        {errorMessage && (
          <p className="mt-3 text-sm" style={{ color: "var(--critical)" }}>
            {errorMessage}
          </p>
        )}
      </form>

      <h2 className="mb-2.5 text-[15px] font-bold">History</h2>
      {logs.length === 0 ? (
        <p className="page-sub">No nutrition entries logged yet.</p>
      ) : (
        <div className="card overflow-x-auto p-4">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Carbs</th>
                <th>Calories</th>
                <th>Weight</th>
                <th>Target</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="mono">{log.log_date}</td>
                  <td>{log.carbs_g !== null ? `${log.carbs_g} g` : "—"}</td>
                  <td>{log.calories !== null ? `${log.calories} kcal` : "—"}</td>
                  <td>{log.body_weight_kg !== null ? `${log.body_weight_kg} kg` : "—"}</td>
                  <td>
                    {log.carb_target_status ? (
                      <span
                        className={`badge badge-${
                          log.carb_target_status === "hit" ? "good" : "critical"
                        }`}
                      >
                        {log.carb_target_status === "hit" ? "Hit" : "Missed"}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td style={{ color: "var(--ink-soft)" }}>
                    {[log.hydration_note, log.notes].filter(Boolean).join(" · ") || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}

function MealItemRow({
  item,
  latestFeedback,
  onSubmit,
}: {
  item: MealRecommendation;
  latestFeedback: MealFeedback | undefined;
  onSubmit: (feedback: {
    rating: number;
    wantsChanged: boolean;
    comment: string;
  }) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(latestFeedback?.rating ?? 4);
  const [wantsChanged, setWantsChanged] = useState(latestFeedback?.wants_changed ?? false);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await onSubmit({ rating, wantsChanged, comment });
    setSaving(false);
    setComment("");
    setOpen(false);
  }

  return (
    <div className="card p-3 px-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[11.5px] font-semibold text-[var(--ink-faint)]">
            {item.slot}
          </div>
          <p className="m-0 text-[13.5px] leading-relaxed">{item.description}</p>
          {latestFeedback && (
            <div className="mt-1.5">
              <span className={`badge badge-${latestFeedback.wants_changed ? "critical" : "good"}`}>
                {latestFeedback.rating ? `${latestFeedback.rating}/5` : "Rated"} ·{" "}
                {latestFeedback.wants_changed ? "Change next time" : "Keep"}
              </span>
            </div>
          )}
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-sm shrink-0"
          onClick={() => setOpen((prev) => !prev)}
        >
          {latestFeedback ? "Update" : "Rate"}
        </button>
      </div>

      {open && (
        <div className="mt-3 border-t border-[var(--line)] pt-3">
          <div className="mb-2.5 flex items-center gap-3">
            <div className="seg">
              {MEAL_RATING_VALUES.map((value) => (
                <button
                  key={value}
                  type="button"
                  className={rating === value ? "on" : ""}
                  onClick={() => setRating(value)}
                >
                  {value}
                </button>
              ))}
            </div>
            <div className="seg">
              <button
                type="button"
                className={!wantsChanged ? "on" : ""}
                onClick={() => setWantsChanged(false)}
              >
                Keep
              </button>
              <button
                type="button"
                className={wantsChanged ? "on" : ""}
                onClick={() => setWantsChanged(true)}
              >
                Change next time
              </button>
            </div>
          </div>
          <textarea
            className="input mb-2.5"
            rows={2}
            placeholder="Optional: why (didn't sit well, too much prep, loved it)"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
          />
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="btn btn-primary btn-sm"
          >
            {saving ? "Saving…" : "Save feedback"}
          </button>
        </div>
      )}
    </div>
  );
}
