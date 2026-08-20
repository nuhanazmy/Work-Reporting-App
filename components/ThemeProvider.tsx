"use client";

import { useEffect } from "react";
import { applyStoredTheme, getStoredTheme } from "@/lib/theme";

export default function ThemeProvider() {
  useEffect(() => {
    applyStoredTheme();

    // If the user picked "system", keep it in sync if their OS setting changes live
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (getStoredTheme() === "system") applyStoredTheme();
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return null;
}