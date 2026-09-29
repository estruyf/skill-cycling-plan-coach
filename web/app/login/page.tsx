"use client";

import { useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabaseClient";
import { IconMail } from "../components/icons";

const FEATURE_CHIPS = [
  { label: "Weekly plan", sub: "built from your logged sessions" },
  { label: "Season macrocycle", sub: "phased around your event date" },
  { label: "Trial-event ladder", sub: "rehearsing your event's limiters" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setErrorMessage("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/plan`
            : undefined,
      },
    });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    setStatus("sent");
  }

  return (
    <main className="flex min-h-screen flex-col nav:flex-row">
      <div
        className="flex flex-col justify-between gap-10 p-8 text-[#F3F1EA] nav:w-[52%] nav:p-14"
        style={{
          background: "var(--brand-dark)",
          backgroundImage:
            "radial-gradient(circle at 85% 12%, rgba(221,91,39,.18), transparent 45%)",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="brand-mark">CP</div>
          <span className="text-base font-bold" style={{ fontFamily: "var(--font-display)" }}>
            Cycling Plan Coach
          </span>
        </div>

        <div className="max-w-[480px]">
          <h1 className="mb-4 text-3xl leading-tight font-bold nav:text-[38px]">
            A coach that reads your data, not just your calendar.
          </h1>
          <p className="text-[15px] leading-relaxed text-[#F3F1EAc7]">
            Strava power curves, Garmin readiness, and logged sessions feed a
            weekly plan and a season built around your event&apos;s own
            limiters — durability, fueling, terrain, heat.
          </p>
        </div>

        <div className="flex flex-wrap gap-3.5">
          {FEATURE_CHIPS.map((chip) => (
            <div
              key={chip.label}
              className="flex-1 min-w-[150px] rounded-[var(--radius-m)] border border-white/[0.16] bg-white/[0.08] p-3.5 px-4"
            >
              <div className="text-[15px] font-semibold">{chip.label}</div>
              <div className="mt-0.5 text-xs text-white/60">{chip.sub}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-8 nav:p-14">
        <div className="w-full max-w-[360px]">
          <h2 className="mb-1.5 text-[22px] font-bold">Sign in</h2>

          {status === "sent" ? (
            <p className="text-[13.5px] leading-relaxed text-[var(--ink-soft)]">
              Check <strong>{email}</strong> for a sign-in link. Open it on
              this device to see this week&apos;s plan.
            </p>
          ) : (
            <>
              <p className="mb-6 text-[13.5px] leading-relaxed text-[var(--ink-soft)]">
                We&apos;ll email you a one-time link — no password to remember.
              </p>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="field">
                  <label htmlFor="email">Email</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[var(--ink-faint)]">
                      <IconMail />
                    </span>
                    <input
                      id="email"
                      className="input pl-9"
                      type="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="btn btn-primary w-full"
                >
                  {status === "sending" ? "Sending…" : "Send sign-in link"}
                </button>

                {status === "error" && (
                  <p style={{ color: "var(--critical)" }} className="text-sm">
                    {errorMessage}
                  </p>
                )}
              </form>
              <p className="mt-5 text-xs leading-relaxed text-[var(--ink-faint)]">
                This account is for viewing your plan and logging sessions.
                Onboarding and plan changes still happen with your coach in
                Claude.
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
