"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { t } from "@/lib/i18n";
import {
  loadSession,
  saveSession,
  type Session,
  type Sex,
} from "@/lib/screening/session";

const SEXES: Sex[] = ["female", "male", "prefer_not_to_say"];

export default function Onboarding() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => setSession(loadSession()), []);

  if (!session) return null;

  const locale = session.locale;
  const ready = session.age !== null && session.age > 0 && session.sex !== null;

  function update(patch: Partial<Session>) {
    const next = { ...session!, ...patch };
    setSession(next);
    saveSession(next);
  }

  return (
    <main className="min-h-screen bg-surface px-6 py-10">
      <div className="max-w-md mx-auto">
        <button
          onClick={() => router.push("/")}
          className="text-sm text-muted"
        >
          {t(locale, "action.back")}
        </button>

        <div className="mt-8 space-y-8">
          <div>
            <label className="block text-lg font-medium text-ink">
              {t(locale, "onboarding.age")}
            </label>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={120}
              value={session.age ?? ""}
              onChange={(e) =>
                update({ age: e.target.value ? Number(e.target.value) : null })
              }
              className="mt-3 w-full rounded-xl border border-brand/20 bg-white px-5 py-4 text-xl focus:border-brand focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-lg font-medium text-ink">
              {t(locale, "onboarding.sex")}
            </label>
            <div className="mt-3 space-y-3">
              {SEXES.map((s) => (
                <button
                  key={s}
                  onClick={() => update({ sex: s })}
                  className={`w-full rounded-xl border px-5 py-4 text-left text-lg transition ${
                    session.sex === s
                      ? "border-brand bg-brand text-white"
                      : "border-brand/20 bg-white text-ink"
                  }`}
                >
                  {t(locale, `onboarding.sex.${s}`)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-lg font-medium text-ink">
              {t(locale, "onboarding.region")}
            </label>
            <input
              type="text"
              value={session.region ?? ""}
              onChange={(e) => update({ region: e.target.value })}
              className="mt-3 w-full rounded-xl border border-brand/20 bg-white px-5 py-4 text-xl focus:border-brand focus:outline-none"
            />
          </div>
        </div>

        <button
          disabled={!ready}
          onClick={() => router.push("/screening")}
          className="mt-10 w-full rounded-xl bg-brand px-6 py-5 text-lg font-medium text-white disabled:opacity-30 active:scale-[0.99] transition"
        >
          {t(locale, "action.next")}
        </button>
      </div>
    </main>
  );
}