"use client";

const KEY = "font_scale";
export const FONT_SCALE_STEPS = [0.875, 1, 1.125, 1.25, 1.375, 1.5];

export function getFontScale(): number {
  if (typeof window === "undefined") return 1;
  const raw = localStorage.getItem(KEY);
  const val = raw ? parseFloat(raw) : 1;
  return FONT_SCALE_STEPS.includes(val) ? val : 1;
}

export function setFontScale(scale: number) {
  localStorage.setItem(KEY, String(scale));
  document.documentElement.style.setProperty("--font-scale", String(scale));
}

export function applyStoredFontScale() {
  const scale = getFontScale();
  document.documentElement.style.setProperty("--font-scale", String(scale));
}