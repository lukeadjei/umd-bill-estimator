"use client";

import { useSyncExternalStore } from "react";
import { SunIcon, MoonIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const THEME_STORAGE_KEY = "theme";
// Fired after this component itself flips the "dark" class, so
// useSyncExternalStore knows to re-read the DOM and re-render. Nothing else
// in the app changes the class, so this is the only source of updates.
const THEME_CHANGE_EVENT = "umd-theme-change";

function subscribe(callback: () => void) {
  window.addEventListener(THEME_CHANGE_EVENT, callback);
  return () => window.removeEventListener(THEME_CHANGE_EVENT, callback);
}

// The single source of truth: whatever's actually on <html> right now. This
// is deliberately a *read*, not a re-derivation of the OS preference -- the
// inline THEME_INIT_SCRIPT in layout.tsx already resolved localStorage vs.
// prefers-color-scheme and set the class before first paint, so this
// component just mirrors that decision instead of making its own.
function getSnapshot() {
  return document.documentElement.classList.contains("dark");
}

// The server has no concept of the visitor's theme, so it always renders as
// if light mode were active. useSyncExternalStore uses this during SSR and
// for the client's very first (hydration) render to match that server
// output exactly, then immediately re-renders with the real getSnapshot()
// value -- the standard, effect-free way to pick up client-only state
// without a hydration mismatch or a post-mount flash of the wrong icon.
function getServerSnapshot() {
  return false;
}

// Fixed, site-wide control rendered once from the root layout (see
// src/app/layout.tsx) so it appears on every page without each page having
// to render it individually.
export function ThemeToggle() {
  const isDark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggleTheme() {
    const next = !isDark;
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next ? "dark" : "light");
    } catch {
      // localStorage can throw (private browsing, disabled storage, etc.) --
      // the toggle still works for the rest of this session, it just won't
      // persist across reloads.
    }
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="fixed top-4 right-4 z-[60] rounded-full bg-background shadow-md print:hidden"
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </Button>
  );
}
