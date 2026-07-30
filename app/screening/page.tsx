"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { t } from "@/lib/i18n";
import { visibleQuestions, type Question } from "@/lib/screening/questions";
import type { AnswerValue } from "@/lib/screening/scoring";
import { loadSession, saveSession, type Session } from "@/lib/screening/session";

const NONE_KEYS = new Set(["none", "never"]);

export default function Screening() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const s = loadSession();
    if (s.age === null || s.sex === null) {
      router.replace("/onboarding");
      return;
    }
    setSession(s);
  }, [router]);

  const visible = useMemo(
    () => (session ? visibleQuestions(session.answers) : []),
    [session]
  );

  if (!session || visible.length === 0) return null;

  const q = visible[Math.min(index, visible.length - 1)];
  const locale = session.locale;
  const value = session.answers[q.id];
  const isLast = index >= visible.length - 1;

  function setAnswer(id: string, v: AnswerValue) {
    const next = {
      ...session!,
      answers: { ...session!.answers, [id]: v },
    };
    setSession(next);
    saveSession(next);
  }

  function advance() {
    if (isLast) router.push("/results");
    else setIndex((i) => i + 1);
  }

  function back() {
    if (index === 0) router.push("/onboarding");
    else setIndex((i) => i - 1);
  }

  function toggleMulti(key: string) {
    const current = Array.isArray(value) ? value : [];
    let next: string[];
    if (NONE_KEYS.has(key)) {
      next = current.includes(key) ? [] : [key];
    } else {
      const without = current.filter((k) => !NONE_KEYS.has(k));
      next = without.includes(key)
        ? without.filter((k) => k !== key)
        : [...without, key];
    }
    setAnswer(q.id, next);
  }

  const answered =
    value !== undefined &&
    value !== "" &&
    !(Array.isArray(value) && value.length === 0);

  return (
    <main className="min-h-screen bg-surface px-6 py-8 flex flex-col">
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col">
        <div className="h-1.5 w-full rounded-full bg-brand/10">
          <div
            className="h-1.5 rounded-full bg-brand transition-all"
            style={{ width: `${((index + 1) / visible.length) * 100}%` }}
          />
        </div>
        <p className="mt-3 text-sm text-muted">
          {t(locale, "progress.label", {
            current: index + 1,
            total: visible.length,
          })}
        </p>

        <div className="mt-8 flex-1">
          <h2 className="text-2xl font-medium text-ink leading-snug">
            {t(locale, q.labelKey)}
          </h2>
          {q.helpKey && (
            <p className="mt-2 text-sm text-muted leading-relaxed">
              {t(locale, q.helpKey)}
            </p>
          )}

          <div className="mt-6 space-y-3">
            {q.type === "single" &&
              q.options?.map((o) => (
                <button
                  key={o.key}
                  onClick={() => {
                    setAnswer(q.id, o.key);
                    setTimeout(advance, 120);
                  }}
                  className={`w-full rounded-xl border px-5 py-4 text-left text-lg transition ${
                    value === o.key
                      ? "border-brand bg-brand text-white"
                      : "border-brand/20 bg-white text-ink"
                  }`}
                >
                  {t(locale, `q.${q.id}.opt.${o.key}`)}
                </button>
              ))}

            {q.type === "multi" &&
              q.options?.map((o) => {
                const on = Array.isArray(value) && value.includes(o.key);
                return (
                  <button
                    key={o.key}
                    onClick={() => toggleMulti(o.key)}
                    className={`w-full rounded-xl border px-5 py-4 text-left text-lg transition ${
                      on
                        ? "border-brand bg-brand text-white"
                        : "border-brand/20 bg-white text-ink"
                    }`}
                  >
                    {t(locale, `q.${q.id}.opt.${o.key}`)}
                  </button>
                );
              })}

            {q.type === "numeric" && (
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  inputMode="numeric"
                  min={q.min}
                  max={q.max}
                  value={typeof value === "number" ? value : ""}
                  onChange={(e) =>
                    setAnswer(
                      q.id,
                      e.target.value ? Number(e.target.value) : ""
                    )
                  }
                  className="flex-1 rounded-xl border border-brand/20 bg-white px-5 py-4 text-xl focus:border-brand focus:outline-none"
                />
                {q.unitKey && (
                  <span className="text-lg text-muted">
                    {t(locale, q.unitKey)}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex items-center gap-3">
          <button
            onClick={back}
            className="rounded-xl border border-brand/20 px-5 py-4 text-muted"
          >
            {t(locale, "action.back")}
          </button>

          {q.optional && !answered && (
            <button
              onClick={advance}
              className="flex-1 rounded-xl border border-brand/20 px-5 py-4 text-muted"
            >
              {t(locale, "action.skip")}
            </button>
          )}

          {q.type !== "single" && answered && (
            <button
              onClick={advance}
              className="flex-1 rounded-xl bg-brand px-5 py-4 text-lg font-medium text-white"
            >
              {t(locale, isLast ? "action.finish" : "action.next")}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}