"use client";

export type Theme = "light" | "dark" | "system";
const KEY = "app_theme";

export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  const raw = localStorage.getItem(KEY);
  return raw === "light" || raw === "dark" || raw === "system" ? raw : "system";
}

export function applyTheme(theme: Theme) {
  const isDark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  document.documentElement.classList.toggle("dark", isDark);
}

export function setTheme(theme: Theme) {
  localStorage.setItem(KEY, theme);
  applyTheme(theme);
}

export function applyStoredTheme() {
  applyTheme(getStoredTheme());
}