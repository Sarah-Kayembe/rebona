"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { t } from "@/lib/i18n";
import { getAnonId } from "@/lib/anon";
import { loadSession } from "@/lib/screening/session";

interface Row {
  id: string;
  riskTier: "low" | "moderate" | "high";
  riskScore: number;
  completedAt: string;
}

interface History {
  screenings: Row[];
  badges: string[];
  totalPoints: number;
  currentStreak: number;
}

export default function HistoryPage() {
  const router = useRouter();
  const [data, setData] = useState<History | null>(null);
  const [error, setError] = useState(false);
  const locale = loadSession().locale;

  useEffect(() => {
    fetch(`/api/history?anonId=${encodeURIComponent(getAnonId())}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setError(true));
  }, []);

  if (error) {
    return (
      <main className="min-h-screen bg-surface px-6 py-10">
        <div className="max-w-md mx-auto">
          <p className="text-lg text-ink">{t(locale, "error.generic")}</p>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-surface flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-brand/20 border-t-brand animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface px-6 py-10">
      <div className="max-w-md mx-auto">
        <button onClick={() => router.push("/")} className="text-sm text-muted">
          {t(locale, "action.back")}
        </button>

        <div className="mt-6 flex gap-3">
          <div className="flex-1 rounded-xl bg-white border border-brand/10 p-4">
            <p className="text-3xl font-semibold text-brand">
              {data.totalPoints}
            </p>
            <p className="mt-1 text-sm text-muted">
              {t(locale, "points.earned", { points: "" })}
            </p>
          </div>
          <div className="flex-1 rounded-xl bg-white border border-brand/10 p-4">
            <p className="text-3xl font-semibold text-brand">
              {data.currentStreak}
            </p>
            <p className="mt-1 text-sm text-muted">
              {t(locale, "streak.current", { days: "" })}
            </p>
          </div>
        </div>

        {data.badges.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {data.badges.map((b) => (
              <span
                key={b}
                className="rounded-full bg-brand-soft px-3 py-1 text-sm text-brand border border-brand/20"
              >
                {t(locale, `badge.${b}`)}
              </span>
            ))}
          </div>
        )}

        {data.screenings.length === 0 ? (
          <p className="mt-10 text-center text-muted leading-relaxed">
            {t(locale, "empty.history")}
          </p>
        ) : (
          <ul className="mt-8 space-y-3">
            {data.screenings.map((s) => (
              <li
                key={s.id}
                className="rounded-xl bg-white border border-brand/10 p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-ink">
                    {t(locale, `result.title.${s.riskTier}`)}
                  </p>
                  <p className="mt-0.5 text-sm text-muted">
                    {new Date(s.completedAt).toLocaleDateString(
                      locale === "tn" ? "en-BW" : "en-GB",
                      { day: "numeric", month: "short", year: "numeric" }
                    )}
                  </p>
                </div>
                <span className="text-2xl font-semibold text-brand">
                  {s.riskScore}
                </span>
              </li>
            ))}
          </ul>
        )}

        <button
          onClick={() => router.push("/")}
          className="mt-8 w-full rounded-xl bg-brand px-6 py-5 text-lg font-medium text-white active:scale-[0.99] transition"
        >
          {t(locale, "action.retake")}
        </button>
      </div>
    </main>
  );
}