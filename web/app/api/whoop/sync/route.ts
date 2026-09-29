// WC2 (daily/cycle readiness pull) + WD1 (per-workout correlation), per
// documents/whoop-integration-tasks.md. Two call sites hit this same
// endpoint: web/app/plan/page.tsx (WC3, browser session) and this skill's
// Step 1 (WC5, curl + WHOOP_INTERNAL_SYNC_SECRET) -- see
// resolveSyncAthleteId in lib/whoopServer.ts for the dual-auth handling.
//
// Response/request field shapes (score_state, nested `score` objects) are
// this session's best-available reading of WHOOP's public v2 API docs, not
// verified against a live WHOOP sandbox account (none is reachable from
// this environment) -- WC2/WD1's own test bar (a real connected account)
// is the way to confirm these before this ships to a real athlete.
import { NextResponse } from "next/server";
import {
  WHOOP_CYCLE_URL,
  WHOOP_RECOVERY_URL,
  WHOOP_SLEEP_URL,
  WHOOP_WORKOUT_URL,
  getValidWhoopAccessToken,
  resolveSyncAthleteId,
  supabaseServiceClient,
} from "@/lib/whoopServer";
import { DAY_ORDER, type Day } from "@/lib/types";

const DEFAULT_LOOKBACK_DAYS = 7;
const WORKOUT_CORRELATION_LOOKBACK_DAYS = 14;
const DAY_MS = 86_400_000;

interface WhoopCollectionResponse<T> {
  records: T[];
  next_token?: string | null;
}

async function fetchWhoopCollection<T>(
  url: string,
  accessToken: string,
  start: Date,
  end: Date
): Promise<T[]> {
  const records: T[] = [];
  let nextToken: string | undefined;
  let pages = 0;

  do {
    const params = new URLSearchParams({
      start: start.toISOString(),
      end: end.toISOString(),
      limit: "25",
    });
    if (nextToken) params.set("nextToken", nextToken);

    const response = await fetch(`${url}?${params.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      throw new Error(`WHOOP collection fetch failed (${url}): ${response.status}`);
    }
    const body: WhoopCollectionResponse<T> = await response.json();
    records.push(...(body.records ?? []));
    nextToken = body.next_token ?? undefined;
    pages += 1;
  } while (nextToken && pages < 20);

  return records;
}

interface WhoopCycle {
  id: number;
  start: string;
  score_state: string;
  score?: { strain?: number };
}

interface WhoopRecovery {
  cycle_id: number;
  score_state: string;
  score?: { recovery_score?: number; hrv_rmssd_milli?: number; resting_heart_rate?: number };
}

interface WhoopSleep {
  cycle_id: number;
  score_state: string;
  score?: { sleep_performance_percentage?: number };
}

interface WhoopWorkout {
  id: number;
  start: string;
  score_state: string;
  score?: {
    strain?: number;
    average_heart_rate?: number;
    max_heart_rate?: number;
    kilojoule?: number;
  };
}

function dateOnly(iso: string): string {
  return iso.slice(0, 10);
}

// WD2's rule, mirrored here in code -- see workout-library.md's
// logged-outcome rule table for the athlete-facing statement of the same
// rule. Kept in sync by hand (a small, mechanical rule set, same pattern
// this repo already uses for its other decision tables).
const EASY_ARCHETYPE_KEYWORDS = ["z2", "endurance", "recovery", "easy"];
const HARD_ARCHETYPE_KEYWORDS = [
  "vo2",
  "threshold",
  "sweet spot",
  "anaerobic",
  "tempo",
  "ftp test",
  "sprint",
];

// WHOOP's 0-21 strain scale bands mirror references/whoop-data.md's
// day_strain table. >=14 is "strenuous"+; <=9 is "light".
function inferSessionStatusFromStrain(archetype: string, strain: number): string {
  const lower = archetype.toLowerCase();
  const plannedEasy = EASY_ARCHETYPE_KEYWORDS.some((k) => lower.includes(k));
  const plannedHard = HARD_ARCHETYPE_KEYWORDS.some((k) => lower.includes(k));

  if (plannedEasy && strain >= 14) return "completed_harder_than_planned";
  if (plannedHard && strain <= 9) return "completed_easier_than_planned";
  return "completed_as_planned";
}

function scheduledDateForWorkout(weekStartDate: string, day: Day): string {
  const start = new Date(`${weekStartDate}T00:00:00Z`);
  start.setUTCDate(start.getUTCDate() + DAY_ORDER.indexOf(day));
  return start.toISOString().slice(0, 10);
}

function withinOneDay(dateA: string, dateB: string): boolean {
  const diff = Math.abs(
    new Date(`${dateA}T00:00:00Z`).getTime() - new Date(`${dateB}T00:00:00Z`).getTime()
  );
  return diff <= DAY_MS;
}

export async function POST(request: Request) {
  let bodyAthleteId: string | null = null;
  try {
    const body = await request.json();
    bodyAthleteId = typeof body?.athlete_id === "string" ? body.athlete_id : null;
  } catch {
    // No JSON body -- fine for a browser session call, which doesn't send one.
  }

  const athleteId = await resolveSyncAthleteId(request, bodyAthleteId);
  if (!athleteId) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const accessToken = await getValidWhoopAccessToken(athleteId);
  if (!accessToken) {
    return NextResponse.json({ error: "No active WHOOP connection." }, { status: 404 });
  }

  const supabase = supabaseServiceClient();

  const { data: lastMetric } = await supabase
    .from("whoop_daily_metrics")
    .select("cycle_date")
    .eq("athlete_id", athleteId)
    .order("cycle_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  const now = new Date();
  const start = lastMetric?.cycle_date
    ? new Date(new Date(lastMetric.cycle_date).getTime() - DAY_MS)
    : new Date(now.getTime() - DEFAULT_LOOKBACK_DAYS * DAY_MS);

  const [cycles, recoveries, sleeps, workouts] = await Promise.all([
    fetchWhoopCollection<WhoopCycle>(WHOOP_CYCLE_URL, accessToken, start, now),
    fetchWhoopCollection<WhoopRecovery>(WHOOP_RECOVERY_URL, accessToken, start, now),
    fetchWhoopCollection<WhoopSleep>(WHOOP_SLEEP_URL, accessToken, start, now),
    fetchWhoopCollection<WhoopWorkout>(
      WHOOP_WORKOUT_URL,
      accessToken,
      new Date(now.getTime() - WORKOUT_CORRELATION_LOOKBACK_DAYS * DAY_MS),
      now
    ),
  ]);

  const recoveryByCycle = new Map(recoveries.map((r) => [r.cycle_id, r]));
  const sleepByCycle = new Map(sleeps.map((s) => [s.cycle_id, s]));

  const dailyRows = cycles
    .filter((c) => c.score_state === "SCORED")
    .map((cycle) => {
      const recovery = recoveryByCycle.get(cycle.id);
      const sleep = sleepByCycle.get(cycle.id);
      return {
        athlete_id: athleteId,
        cycle_date: dateOnly(cycle.start),
        recovery_score: recovery?.score?.recovery_score ?? null,
        hrv_rmssd_milli: recovery?.score?.hrv_rmssd_milli ?? null,
        resting_heart_rate: recovery?.score?.resting_heart_rate ?? null,
        sleep_performance_percentage: sleep?.score?.sleep_performance_percentage ?? null,
        day_strain: cycle.score?.strain ?? null,
        pulled_at: new Date().toISOString(),
      };
    });

  let latestMetric = null;
  if (dailyRows.length > 0) {
    const { data, error } = await supabase
      .from("whoop_daily_metrics")
      .upsert(dailyRows, { onConflict: "athlete_id,cycle_date" })
      .select()
      .order("cycle_date", { ascending: false });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    latestMetric = data?.[0] ?? null;
  }

  const workoutMatches = await correlateWorkouts(supabase, athleteId, workouts);

  return NextResponse.json({ latest: latestMetric, workoutMatches });
}

async function correlateWorkouts(
  supabase: ReturnType<typeof supabaseServiceClient>,
  athleteId: string,
  whoopWorkouts: WhoopWorkout[]
): Promise<number> {
  const scoredWorkouts = whoopWorkouts.filter((w) => w.score_state === "SCORED" && w.score);
  if (scoredWorkouts.length === 0) return 0;

  const cutoff = new Date(Date.now() - WORKOUT_CORRELATION_LOOKBACK_DAYS * DAY_MS)
    .toISOString()
    .slice(0, 10);

  const { data: plans } = await supabase
    .from("plans")
    .select("id, week_start_date")
    .eq("athlete_id", athleteId)
    .gte("week_start_date", cutoff);

  if (!plans || plans.length === 0) return 0;
  const planWeekStart = new Map(plans.map((p) => [p.id, p.week_start_date as string]));

  const { data: candidates } = await supabase
    .from("workouts")
    .select("id, day, archetype, plan_id")
    .in(
      "plan_id",
      plans.map((p) => p.id)
    );

  if (!candidates || candidates.length === 0) return 0;

  const { data: existingLogs } = await supabase
    .from("workout_logs")
    .select("workout_id")
    .eq("source", "whoop")
    .in(
      "workout_id",
      candidates.map((c) => c.id)
    );

  const alreadyLogged = new Set((existingLogs ?? []).map((l) => l.workout_id as string));
  const usedWhoopWorkoutIds = new Set<number>();
  let matched = 0;

  for (const candidate of candidates) {
    if (alreadyLogged.has(candidate.id)) continue;

    const weekStartDate = planWeekStart.get(candidate.plan_id);
    if (!weekStartDate) continue;
    const scheduledDate = scheduledDateForWorkout(weekStartDate, candidate.day as Day);

    const match = scoredWorkouts.find(
      (w) => !usedWhoopWorkoutIds.has(w.id) && withinOneDay(dateOnly(w.start), scheduledDate)
    );
    if (!match?.score) continue;

    usedWhoopWorkoutIds.add(match.id);

    const status = inferSessionStatusFromStrain(candidate.archetype, match.score.strain ?? 0);

    await supabase
      .from("workouts")
      .update({
        actual: {
          strain: match.score.strain ?? null,
          average_heart_rate: match.score.average_heart_rate ?? null,
          max_heart_rate: match.score.max_heart_rate ?? null,
          kilojoule: match.score.kilojoule ?? null,
        },
      })
      .eq("id", candidate.id);

    await supabase.from("workout_logs").insert({
      workout_id: candidate.id,
      athlete_id: athleteId,
      status,
      source: "whoop",
      notes: `WHOOP strain ${match.score.strain ?? "n/a"}`,
    });

    matched += 1;
  }

  return matched;
}
