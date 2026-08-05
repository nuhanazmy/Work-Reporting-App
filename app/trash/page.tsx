"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { getTrash, removeFromTrashPermanently, restoreTask, daysRemaining, TrashedTask } from "@/lib/trash";
import { FiRotateCcw, FiTrash2 } from "react-icons/fi";

export default function TrashPage() {
  const [items, setItems] = useState<TrashedTask[]>([]);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  useEffect(() => {
    setItems(getTrash());
  }, []);

  function refresh() {
    setItems(getTrash());
  }

  function handleRestore(item: TrashedTask) {
    // Real restoration (putting it back into the actual Day tab list) will
    // happen once this is wired to Supabase. For now, this just removes it
    // from Trash and confirms the action.
    restoreTask(item);
    refresh();
  }

  function handlePermanentDelete(id: string) {
    removeFromTrashPermanently(id);
    setConfirmingId(null);
    refresh();
  }

  const listLabels: Record<TrashedTask["originalList"], string> = {
    todo: "To-do list",
    done: "Task done today",
    followup: "Follow up",
  };

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />

      <main className="flex-1 p-6 pt-20 md:pt-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold">Trash</h1>
          <p className="text-xs text-gray-400">Items auto-delete after 30 days</p>
        </div>

        {items.length === 0 ? (
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
                    <p className="text-sm text-gray-800">{item.title}</p>
                    <p className="text-xs text-gray-400">
                      From {listLabels[item.originalList]} · deleted {new Date(item.deletedAt).toLocaleDateString()} ·
                      expires in {daysRemaining(item.deletedAt)} days
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRestore(item)}
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