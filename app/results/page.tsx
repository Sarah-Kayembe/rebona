"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { t } from "@/lib/i18n";
import { getAnonId } from "@/lib/anon";
import { clearSession, loadSession } from "@/lib/screening/session";

interface Contribution {
  questionId: string;
  points: number;
  reasonKey: string;
}

interface Result {
  score: number;
  tier: "low" | "moderate" | "high";
  contributions: Contribution[];
  bmi: number | null;
  urgent: boolean;
  urgentReasonKeys: string[];
  points: number;
  totalPoints: number;
  streak: number;
  newBadges: string[];
}

export default function Results() {
  const router = useRouter();
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState(false);
  const [locale, setLocale] = useState<"en" | "tn">("en");
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;

    const session = loadSession();
    if (session.age === null || session.sex === null) {
      router.replace("/onboarding");
      return;
    }
    setLocale(session.locale);

    fetch("/api/screenings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        anonId: getAnonId(),
        locale: session.locale,
        age: session.age,
        sex: session.sex,
        region: session.region,
        answers: session.answers,
      }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: Result) => {
        setResult(data);
        clearSession();
      })
      .catch(() => setError(true));
  }, [router]);

  if (error) {
    return (
      <main className="min-h-screen bg-surface px-6 py-10">
        <div className="max-w-md mx-auto">
          <p className="text-lg text-ink">{t(locale, "error.generic")}</p>
        </div>
      </main>
    );
  }

  if (!result) {
    return (
      <main className="min-h-screen bg-surface flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-brand/20 border-t-brand animate-spin" />
      </main>
    );
  }

  const maxPoints = Math.max(...result.contributions.map((c) => c.points), 1);

  return (
    <main className="min-h-screen bg-surface px-6 py-10">
      <div className="max-w-md mx-auto">
        {result.urgent && (
          <div className="mb-6 rounded-xl border-2 border-brand bg-brand-soft p-5">
            <p className="font-semibold text-brand">
              {t(locale, "urgent.banner")}
            </p>
            <ul className="mt-2 space-y-1">
              {result.urgentReasonKeys.map((k) => (
                <li key={k} className="text-sm text-ink leading-relaxed">
                  {t(locale, k)}
                </li>
              ))}
            </ul>
          </div>
        )}

        <h1 className="text-3xl font-semibold text-brand leading-tight tracking-tight">
          {t(locale, `result.title.${result.tier}`)}
        </h1>
        <p className="mt-4 text-lg text-ink leading-relaxed">
          {t(locale, `result.body.${result.tier}`)}
        </p>

        <div className="mt-6 flex gap-3">
          <div className="flex-1 rounded-xl bg-white border border-brand/10 p-4">
            <p className="text-sm text-muted">
              {t(locale, "result.score", { score: "" })}
            </p>
            <p className="mt-1 text-3xl font-semibold text-brand">
              {result.score}
            </p>
          </div>
          {result.bmi !== null && (
            <div className="flex-1 rounded-xl bg-white border border-brand/10 p-4">
              <p className="text-sm text-muted">
                {t(locale, "result.bmi", { value: "" })}
              </p>
              <p className="mt-1 text-3xl font-semibold text-brand">
                {result.bmi}
              </p>
            </div>
          )}
        </div>

        {result.contributions.length > 0 && (
          <section className="mt-8">
            <h2 className="text-lg font-medium text-ink">
              {t(locale, "result.factors")}
            </h2>
            <ul className="mt-4 space-y-3">
              {result.contributions.map((c) => (
                <li key={c.questionId}>
                  <div className="flex justify-between text-sm">
                    <span className="text-ink">{t(locale, c.reasonKey)}</span>
                    <span className="text-muted">+{c.points}</span>
                  </div>
                  <div className="mt-1.5 h-2 w-full rounded-full bg-brand/10">
                    <div
                      className="h-2 rounded-full bg-brand"
                      style={{ width: `${(c.points / maxPoints) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-8 rounded-xl bg-brand-soft p-5">
          <p className="font-medium text-brand">
            {t(locale, "points.earned", { points: result.points })}
          </p>
          <p className="mt-1 text-sm text-muted">
            {t(locale, "streak.current", { days: result.streak })}
          </p>
          {result.newBadges.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {result.newBadges.map((b) => (
                <span
                  key={b}
                  className="rounded-full bg-white px-3 py-1 text-sm text-brand border border-brand/20"
                >
                  {t(locale, `badge.${b}`)}
                </span>
              ))}
            </div>
          )}
        </section>

        <p className="mt-8 text-sm text-muted leading-relaxed">
          {t(locale, "disclaimer.full")}
        </p>

        <button
          onClick={() => router.push("/")}
          className="mt-6 w-full rounded-xl bg-brand px-6 py-5 text-lg font-medium text-white active:scale-[0.99] transition"
        >
          {t(locale, "action.retake")}
        </button>
      </div>
    </main>
  );
}