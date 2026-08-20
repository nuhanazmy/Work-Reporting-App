"use client";

import { useEffect } from "react";
import { applyStoredFontScale } from "@/lib/fontScale";

export default function FontScaleProvider() {
  useEffect(() => {
    applyStoredFontScale();
  }, []);

  return null;
}