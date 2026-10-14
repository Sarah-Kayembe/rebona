import type { Locale } from "@/lib/i18n";
import type { AnswerValue } from "./scoring";

/**
 * The whole in-progress screening lives in localStorage until the person
 * finishes. One database write at the end rather than a write per question,
 * which keeps the app usable on a bad connection and means no half-rows.
 */
export const SESSION_KEY = "rebona_session";
const KEY = SESSION_KEY;

// Components using the useSession hook re-render when the session changes.
const listeners = new Set<() => void>();

export function subscribeSession(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function notify(): void {
  listeners.forEach((listener) => listener());
}

export type Sex = "female" | "male" | "prefer_not_to_say";

export interface Session {
  locale: Locale;
  age: number | null;
  sex: Sex | null;
  region: string | null;
  answers: Record<string, AnswerValue>;
  startedAt: string | null;
}

export const EMPTY_SESSION: Session = {
  locale: "en",
  age: null,
  sex: null,
  region: null,
  answers: {},
  startedAt: null,
};

export function loadSession(): Session {
  if (typeof window === "undefined") return EMPTY_SESSION;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...EMPTY_SESSION, ...JSON.parse(raw) } : EMPTY_SESSION;
  } catch {
    return EMPTY_SESSION;
  }
}

export function saveSession(session: Session): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(session));
  notify();
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
  notify();
}