"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/client";
import { FiRotateCcw, FiTrash2 } from "react-icons/fi";

type TrashRow = {
  id: string;
  task: string;
  status: string;
  deleted_at: string;
};

const RETENTION_DAYS = 30;

function daysRemaining(deletedAt: string): number {
  const expiresAt = new Date(deletedAt).getTime() + RETENTION_DAYS * 24 * 60 * 60 * 1000;
  return Math.max(0, Math.ceil((expiresAt - Date.now()) / (24 * 60 * 60 * 1000)));
}

export default function TrashPage() {
  const [items, setItems] = useState<TrashRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const loadTrash = useCallback(async () => {
    setLoading(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { data, error: fetchError } = await supabase
      .from("daily_tasks")
      .select("id, task, status, deleted_at")
      .eq("user_id", user.id)
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    setItems(data ?? []);
    setLoading(false);
  }, [supabase, router]);

  useEffect(() => {
    loadTrash();
  }, [loadTrash]);

  async function handleRestore(id: string) {
    const { error: restoreError } = await supabase
      .from("daily_tasks")
      .update({ deleted_at: null })
      .eq("id", id);

    if (restoreError) {
      setError(restoreError.message);
      return;
    }
    await loadTrash();
  }

  async function handlePermanentDelete(id: string) {
    const { error: deleteError } = await supabase
      .from("daily_tasks")
      .delete()
      .eq("id", id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    setConfirmingId(null);
    await loadTrash();
  }

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />

      <main className="flex-1 p-6 pt-20 md:pt-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold">Trash</h1>
          <p className="text-xs text-gray-400">Items auto-delete after 30 days</p>
        </div>

        {error && <p className="text-xs text-red-600 mb-4">{error}</p>}

        {loading ? (
          <p className="text-sm text-gray-400">Loading trash…</p>
        ) : items.length === 0 ? (
          <div className="border border-gray-200 rounded-lg p-8 text-center max-w-sm">
            <p className="text-sm font-medium text-gray-700 mb-1">Trash is empty</p>
            <p className="text-xs text-gray-400">Deleted tasks appear here before being permanently removed</p>
          </div>
        ) : (
          <div className="space-y-2 max-w-2xl">
            {items.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-lg px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-800">{item.task}</p>
                    <p className="text-xs text-gray-400">
                      Deleted {new Date(item.deleted_at).toLocaleDateString()} · expires in{" "}
                      {daysRemaining(item.deleted_at)} days
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRestore(item.id)}
                      className="text-xs px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-1"
                    >
                      <FiRotateCcw size={12} /> Restore
                    </button>
                    {confirmingId === item.id ? (
                      <button
                        onClick={() => handlePermanentDelete(item.id)}
                        className="text-xs px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700"
                      >
                        Confirm delete
                      </button>
                    ) : (
                      <button
                        onClick={() => setConfirmingId(item.id)}
                        className="text-xs px-3 py-1.5 border border-red-300 text-red-600 rounded-md hover:bg-red-50 flex items-center gap-1"
                      >
                        <FiTrash2 size={12} /> Delete forever
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}