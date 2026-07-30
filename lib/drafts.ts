"use client";

import { TaskFormData } from "@/components/TaskModal";

export type DraftTask = {
  id: string;
  data: TaskFormData;
  savedAt: string;
};

const KEY = "draft_tasks";

export function getDrafts(): DraftTask[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addDraft(data: TaskFormData): DraftTask {
  const drafts = getDrafts();
  const newDraft: DraftTask = { id: crypto.randomUUID(), data, savedAt: new Date().toISOString() };
  localStorage.setItem(KEY, JSON.stringify([...drafts, newDraft]));
  return newDraft;
}

export function removeDraft(id: string) {
  const drafts = getDrafts().filter((d) => d.id !== id);
  localStorage.setItem(KEY, JSON.stringify(drafts));
}