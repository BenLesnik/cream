"use client";

import { useEffect, useSyncExternalStore } from "react";
import { ACCENTS, MAP_STYLES } from "@/lib/constants";
import { useSettings } from "@/store/settings";

function subscribeScheme(cb: () => void) {
  const mq = matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

export function useResolvedTheme(): "light" | "dark" {
  const theme = useSettings((s) => s.theme);
  const systemDark = useSyncExternalStore(
    subscribeScheme,
    () => matchMedia("(prefers-color-scheme: dark)").matches,
    () => false,
  );
  return theme === "system" ? (systemDark ? "dark" : "light") : theme;
}

export function ThemeController() {
  const resolved = useResolvedTheme();
  const accentId = useSettings((s) => s.accent);

  useEffect(() => {
    document.documentElement.dataset.theme = resolved;
  }, [resolved]);

  useEffect(() => {
    const accent = ACCENTS.find((a) => a.id === accentId) ?? ACCENTS[0];
    const root = document.documentElement.style;
    let value = accent.value;
    let ink = accent.ink;
    if (accent.id === "ink" && resolved === "dark") {
      value = "#f0eee9";
      ink = "#0e0e0d";
    }
    root.setProperty("--accent", value);
    root.setProperty("--accent-ink", ink);
  }, [accentId, resolved]);

  return null;
}

export function isDarkMapStyle(id: string) {
  return MAP_STYLES.find((s) => s.id === id)?.dark ?? false;
}
