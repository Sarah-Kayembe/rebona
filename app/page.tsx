"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { t, type Locale } from "@/lib/i18n";
import { loadSession, saveSession } from "@/lib/screening/session";

export default function Home() {
  const router = useRouter();
  const [locale, setLocale] = useState<Locale>("en");

  function start() {
    saveSession({
      ...loadSession(),
      locale,
      startedAt: new Date().toISOString(),
    });
    router.push("/onboarding");
  }

  return (
    <main className="min-h-screen bg-surface px-6 py-10 flex flex-col">
      <div className="flex justify-end">
        <div className="inline-flex rounded-full border border-brand/20 p-1">
          {(["en", "tn"] as Locale[]).map((l) => (
            <button
              key={l}
              onClick={() => setLocale(l)}
              className={`px-4 py-2 text-sm rounded-full transition ${
                locale === l ? "bg-brand text-white" : "text-muted"
              }`}
            >
              {l === "en" ? "English" : "Setswana"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        <h1 className="text-4xl font-semibold text-brand tracking-tight">
          {t(locale, "app.name")}
        </h1>
        <p className="mt-3 text-lg text-ink leading-relaxed">
          {t(locale, "app.tagline")}
        </p>

        <div className="mt-8 rounded-xl bg-brand-soft p-5">
          <p className="font-medium text-brand">
            {t(locale, "disclaimer.short")}
          </p>
          <p className="mt-2 text-sm text-muted leading-relaxed">
            {t(locale, "disclaimer.full")}
          </p>
        </div>

        <button
          onClick={start}
          className="mt-8 w-full rounded-xl bg-brand px-6 py-5 text-lg font-medium text-white active:scale-[0.99] transition"
        >
          {t(locale, "action.start")}
        </button>

        <p className="mt-4 text-center text-sm text-muted">
          {t(locale, "onboarding.privacy")}
        </p>
      </div>
    </main>
  );
}