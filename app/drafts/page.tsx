"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import TaskModal, { TaskFormData } from "@/components/TaskModal";
import { getDrafts, removeDraft, addDraft, DraftTask } from "@/lib/drafts";
import { FiEdit2, FiTrash2 } from "react-icons/fi";

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<DraftTask[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDraft, setEditingDraft] = useState<DraftTask | null>(null);

  useEffect(() => {
    setDrafts(getDrafts());
  }, []);

  function refresh() {
    setDrafts(getDrafts());
  }

  function handleContinue(draft: DraftTask) {
    setEditingDraft(draft);
    setModalOpen(true);
  }

  function handleDelete(id: string) {
    removeDraft(id);
    refresh();
  }

  function handleModalSave(data: TaskFormData, saveMode: "active" | "draft") {
    if (editingDraft) removeDraft(editingDraft.id);

    if (saveMode === "draft") {
      addDraft(data);
    }
    // "active" (Add to list) here just clears the draft for now — real
    // insertion into the Day tab happens once this connects to Supabase.

    setEditingDraft(null);
    refresh();
  }

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />

      <main className="flex-1 p-6 pt-20 md:pt-6">
        <h1 className="text-lg font-semibold mb-4">Drafts</h1>

        {drafts.length === 0 ? (
          <div className="border border-gray-200 rounded-lg p-8 text-center max-w-sm">
            <p className="text-sm font-medium text-gray-700 mb-1">No drafts saved</p>
            <p className="text-xs text-gray-400">Tasks you save as draft from the Day tab appear here</p>
          </div>
        ) : (
          <div className="space-y-2 max-w-2xl">
            {drafts.map((d) => (
              <div key={d.id} className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3">
                <div>
                  <p className="text-sm text-gray-800">{d.data.task || "Untitled draft"}</p>
                  <p className="text-xs text-gray-400">Saved {new Date(d.savedAt).toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleContinue(d)}
                    className="text-xs px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-1"
                  >
                    <FiEdit2 size={12} /> Continue
                  </button>
                  <button
                    onClick={() => handleDelete(d.id)}
                    className="text-xs px-3 py-1.5 border border-red-300 text-red-600 rounded-md hover:bg-red-50 flex items-center gap-1"
                  >
                    <FiTrash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <TaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleModalSave}
        initialData={editingDraft?.data}
      />
    </div>
  );
}