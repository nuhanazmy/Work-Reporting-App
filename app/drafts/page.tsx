"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import TaskModal, { TaskFormData } from "@/components/TaskModal";
import { createClient } from "@/lib/supabase/client";
import { FiEdit2, FiTrash2 } from "react-icons/fi";

type DraftRow = {
  id: string;
  task: string;
  tppi: string | null;
  category: string | null;
  output: string | null;
  short_code: string | null;
  link: string | null;
  collaborators: string[] | null;
  time_taken: string | null;
  created_at: string;
};

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<DraftRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDraft, setEditingDraft] = useState<DraftRow | null>(null);

  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const loadDrafts = useCallback(async () => {
    setLoading(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { data, error: fetchError } = await supabase
      .from("daily_tasks")
      .select("id, task, tppi, category, output, short_code, link, collaborators, time_taken, created_at")
      .eq("user_id", user.id)
      .eq("status", "draft")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    setDrafts(data ?? []);
    setLoading(false);
  }, [supabase, router]);

  useEffect(() => {
    loadDrafts();
  }, [loadDrafts]);

  function handleContinue(draft: DraftRow) {
    setEditingDraft(draft);
    setModalOpen(true);
  }

  async function handleDelete(id: string) {
    const { error: deleteError } = await supabase
      .from("daily_tasks")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    await loadDrafts();
  }

  async function handleModalSave(data: TaskFormData, saveMode: "active" | "draft") {
    if (!editingDraft) return;

    const status = saveMode === "draft" ? "draft" : "pending";

    const { error: updateError } = await supabase
      .from("daily_tasks")
      .update({
        tppi: data.tppi || null,
        category: data.category || null,
        task: data.task,
        output: data.output || null,
        short_code: data.code || null,
        link: data.link || null,
        collaborators: data.collaborators ? data.collaborators.split(",").map((c) => c.trim()) : null,
        time_taken: data.timeTaken.includes(":") && data.timeTaken !== ":" ? `${data.timeTaken}:00` : null,
        status,
        // Moving out of draft means it should count as today's task now
        task_date: status === "pending" ? new Date().toISOString().slice(0, 10) : undefined,
      })
      .eq("id", editingDraft.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setEditingDraft(null);
    setModalOpen(false);
    await loadDrafts();
  }

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />

      <main className="flex-1 p-6 pt-20 md:pt-6">
        <h1 className="text-lg font-semibold mb-4">Drafts</h1>

        {error && <p className="text-xs text-red-600 mb-4">{error}</p>}

        {loading ? (
          <p className="text-sm text-gray-400">Loading drafts…</p>
        ) : drafts.length === 0 ? (
          <div className="border border-gray-200 rounded-lg p-8 text-center max-w-sm">
            <p className="text-sm font-medium text-gray-700 mb-1">No drafts saved</p>
            <p className="text-xs text-gray-400">Tasks you save as draft from the Day tab appear here</p>
          </div>
        ) : (
          <div className="space-y-2 max-w-2xl">
            {drafts.map((d) => (
              <div key={d.id} className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3">
                <div>
                  <p className="text-sm text-gray-800">{d.task || "Untitled draft"}</p>
                  <p className="text-xs text-gray-400">Saved {new Date(d.created_at).toLocaleString()}</p>
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
        initialData={
          editingDraft
            ? {
              tppi: editingDraft.tppi || "",
              category: editingDraft.category || "",
              task: editingDraft.task,
              output: editingDraft.output || "",
              code: editingDraft.short_code || "",
              link: editingDraft.link || "",
              collaborators: editingDraft.collaborators?.join(", ") || "",
              timeTaken: editingDraft.time_taken?.slice(0, 5) || "",
              followUp: "neither",
            }
            : undefined
        }
        forceAddButtons
      />
    </div>
  );
}