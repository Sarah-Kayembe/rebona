import en from "@/messages/en.json";

export const LOCALES = ["en", "tn"] as const;
export type Locale = (typeof LOCALES)[number];

const catalogues: Record<Locale, Record<string, string>> = {
  en,
  tn: en, // Setswana lands here later, English is the fallback until then
};

export function t(
  locale: Locale,
  key: string,
  vars?: Record<string, string | number>
): string {
  const raw = catalogues[locale][key] ?? catalogues.en[key] ?? key;
  if (!vars) return raw;
  return Object.entries(vars).reduce(
    (out, [k, v]) => out.replaceAll(`{${k}}`, String(v)),
    raw
  );
}