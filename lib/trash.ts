"use client";

export type TrashedTask = {
  id: string;
  title: string;
  originalList: "todo" | "done" | "followup";
  deletedAt: string;
};

const KEY = "trashed_tasks";
const RETENTION_DAYS = 30;
const RESTORE_KEY = "restored_tasks";

export function restoreTask(item: TrashedTask) {
  const raw = localStorage.getItem(RESTORE_KEY);
  const existing: TrashedTask[] = raw ? JSON.parse(raw) : [];
  localStorage.setItem(RESTORE_KEY, JSON.stringify([...existing, item]));
  removeFromTrashPermanently(item.id);
}

export function getAndClearRestoredTasks(): TrashedTask[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(RESTORE_KEY);
  const items: TrashedTask[] = raw ? JSON.parse(raw) : [];
  localStorage.removeItem(RESTORE_KEY);
  return items;
}

export function getTrash(): TrashedTask[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    const items: TrashedTask[] = raw ? JSON.parse(raw) : [];
    // Auto-purge anything older than the retention window
    const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
    const kept = items.filter((t) => new Date(t.deletedAt).getTime() > cutoff);
    if (kept.length !== items.length) {
      localStorage.setItem(KEY, JSON.stringify(kept));
    }
    return kept;
  } catch {
    return [];
  }
}

export function moveToTrash(title: string, originalList: TrashedTask["originalList"]): TrashedTask {
  const trash = getTrash();
  const item: TrashedTask = {
    id: crypto.randomUUID(),
    title,
    originalList,
    deletedAt: new Date().toISOString(),
  };
  localStorage.setItem(KEY, JSON.stringify([...trash, item]));
  return item;
}

export function removeFromTrashPermanently(id: string) {
  const trash = getTrash().filter((t) => t.id !== id);
  localStorage.setItem(KEY, JSON.stringify(trash));
}

export function daysRemaining(deletedAt: string): number {
  const deletedTime = new Date(deletedAt).getTime();
  const expiresAt = deletedTime + RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const msRemaining = expiresAt - Date.now();
  return Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));
}