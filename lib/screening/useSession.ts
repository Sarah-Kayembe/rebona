"use client";

import { useSyncExternalStore } from "react";
import { SESSION_KEY, loadSession, subscribeSession, type Session } from "./session";

// loadSession parses fresh each call, so keep the last result and only
// re-parse when the stored text changes. React needs a stable snapshot.
let lastRaw: string | null | undefined;
let lastSession: Session | null = null;

function snapshot(): Session {
  const raw = localStorage.getItem(SESSION_KEY);
  if (raw !== lastRaw || lastSession === null) {
    lastRaw = raw;
    lastSession = loadSession();
  }
  return lastSession;
}

/**
 * The in-progress screening from localStorage. Returns null during the
 * server render and the first client render, then the stored session.
 * Saving with saveSession re-renders every component using this hook.
 */
export function useSession(): Session | null {
  return useSyncExternalStore(subscribeSession, snapshot, () => null);
}
