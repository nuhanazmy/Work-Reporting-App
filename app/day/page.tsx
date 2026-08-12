"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import TaskModal, { TaskFormData } from "@/components/TaskModal";
import { FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";
import { createClient } from "@/lib/supabase/client";

type TaskStatus = "pending" | "completed" | "follow_up" | "draft";
type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  raw: {
    tppi: string | null;
    category: string | null;
    output: string | null;
    short_code: string | null;
    link: string | null;
    collaborators: string[] | null;
    time_taken: string | null;
    importance: number | null;
    urgency: number | null;
  };
};
type ListKey = "todo" | "done" | "followup";

function StatusBadge({ status }: { status: TaskStatus }) {
  const styles: Record<TaskStatus, string> = {
    pending: "bg-gray-100 text-gray-600",
    completed: "bg-green-50 text-green-700",
    follow_up: "bg-blue-50 text-blue-700",
    draft: "bg-amber-50 text-amber-700",
  };
  const labels: Record<TaskStatus, string> = {
    pending: "Pending",
    completed: "Completed",
    follow_up: "Follow-up",
    draft: "Draft",
  };
  return <span className={`text-[10px] px-1.5 py-0.5 rounded ${styles[status]}`}>{labels[status]}</span>;
}

// Turns the follow-up quadrant picker into a 1-5 importance/urgency pair
function quadrantToScores(followUp: TaskFormData["followUp"]): { importance: number; urgency: number } {
  switch (followUp) {
    case "urgent_important": return { importance: 5, urgency: 5 };
    case "important": return { importance: 5, urgency: 1 };
    case "urgent": return { importance: 1, urgency: 5 };
    default: return { importance: 1, urgency: 1 };
  }
}

function todayStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function tomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function DayTabPage() {
  const [tab, setTab] = useState<"day" | "week">("day");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<{ listKey: ListKey; task: Task } | null>(null);
  const [addTargetList, setAddTargetList] = useState<ListKey>("todo");
  const [saving, setSaving] = useState(false);
  const [previewTomorrow, setPreviewTomorrow] = useState(false);

  const [todoTasks, setTodoTasks] = useState<Task[]>([]);
  const [doneTasks, setDoneTasks] = useState<Task[]>([]);
  const [followUps, setFollowUps] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "short", day: "numeric", month: "long", year: "numeric",
  });

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { data: tasks, error: fetchError } = await supabase
      .from("daily_tasks")
      .select("id, task, status, is_follow_up, tppi, category, output, short_code, link, collaborators, time_taken, importance, urgency")
      .eq("user_id", user.id)
      .eq("task_date", previewTomorrow ? tomorrowStr() : todayStr())
      .is("deleted_at", null);

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    const mapRow = (t: any): Task => ({
      id: t.id,
      title: t.task,
      status: t.status,
      raw: {
        tppi: t.tppi, category: t.category, output: t.output,
        short_code: t.short_code, link: t.link, collaborators: t.collaborators,
        time_taken: t.time_taken, importance: t.importance, urgency: t.urgency,
      },
    });

    if (tasks) {
      setTodoTasks(tasks.filter((t) => t.status === "pending" && !t.is_follow_up).map(mapRow));
      setDoneTasks(tasks.filter((t) => t.status === "completed").map(mapRow));
      setFollowUps(tasks.filter((t) => t.is_follow_up).map(mapRow));
    }

    setLoading(false);
  }, [supabase, router, previewTomorrow]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  function openAddModal(listKey: ListKey) {
    setEditing(null);
    setAddTargetList(listKey);
    setModalOpen(true);
  }

  function openEditModal(listKey: ListKey, task: Task) {
    setEditing({ listKey, task });
    setModalOpen(true);
  }

  async function handleSave(data: TaskFormData, saveMode: "active" | "draft") {
    setSaving(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const isMarkedFollowUp = data.followUp !== "neither";
    const { importance, urgency } = quadrantToScores(data.followUp);
    const status: TaskStatus = saveMode === "draft" ? "draft" : "pending";

    const timeTaken = data.timeTaken.includes(":") && data.timeTaken !== ":"
      ? `${data.timeTaken}:00`
      : null;

    const payload = {
      user_id: user.id,
      tppi: data.tppi || null,
      category: data.category || null,
      task: data.task,
      output: data.output || null,
      short_code: data.code || null,
      link: data.link || null,
      collaborators: data.collaborators ? data.collaborators.split(",").map((c) => c.trim()) : null,
      time_taken: timeTaken,
      status,
      importance,
      urgency,
      is_follow_up: false, // this row itself; the carried-over copy (if any) is inserted separately below
    };

    if (editing) {
      const { error: updateError } = await supabase
        .from("daily_tasks")
        .update(payload)
        .eq("id", editing.task.id);

      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from("daily_tasks")
        .insert({ ...payload, task_date: todayStr() })
        .select("id")
        .single();

      if (insertError) {
        setError(insertError.message);
        setSaving(false);
        return;
      }

      // If marked as follow-up, create tomorrow's carried-over task explicitly
      if (isMarkedFollowUp && saveMode === "active") {
        await supabase.from("daily_tasks").insert({
          user_id: user.id,
          task_date: tomorrowStr(),
          tppi: data.tppi || null,
          category: data.category || null,
          task: data.task,
          status: "pending",
          importance,
          urgency,
          is_follow_up: true,
          source_task_id: inserted?.id ?? null,
        });
      }
    }

    setSaving(false);
    setModalOpen(false);
    await loadTasks();
  }

  async function handleDelete() {
    if (!editing) return;
    setSaving(true);
    const { error: deleteError } = await supabase
      .from("daily_tasks")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", editing.task.id);

    if (deleteError) {
      setError(deleteError.message);
    }
    setSaving(false);
    setModalOpen(false);
    await loadTasks();
  }

  async function handleComplete() {
    if (!editing) return;
    setSaving(true);
    const { error: completeError } = await supabase
      .from("daily_tasks")
      .update({ status: "completed" })
      .eq("id", editing.task.id);

    if (completeError) {
      setError(completeError.message);
    }
    setSaving(false);
    setModalOpen(false);
    await loadTasks();
  }

  async function handleQuickDelete(taskId: string) {
    const { error: deleteError } = await supabase
      .from("daily_tasks")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", taskId);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    await loadTasks();
  }

  function TaskCard({ task, listKey }: { task: Task; listKey: ListKey }) {
    return (
      <div className="group relative text-sm text-gray-700 border border-gray-100 rounded-md px-3 py-2 bg-gray-50 hover:bg-gray-100 cursor-pointer">
        <button onClick={() => openEditModal(listKey, task)} className="w-full text-left pr-12 flex items-center gap-2">
          <span className="flex-1 truncate">{task.title}</span>
          <StatusBadge status={task.status} />
        </button>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-50">
          <button
            onClick={() => openEditModal(listKey, task)}
            className="p-1 rounded hover:bg-gray-200 text-gray-500"
            aria-label="Edit task"
          >
            <FiEdit2 size={13} />
          </button>
          <button
            onClick={() => handleQuickDelete(task.id)}
            className="p-1 rounded hover:bg-red-100 text-red-500"
            aria-label="Delete task"
          >
            <FiTrash2 size={13} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />

      <main className="flex-1 p-6 pt-20 md:pt-6">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab("day")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium ${tab === "day" ? "bg-green-50 text-green-700" : "text-gray-500 border border-gray-300"
              }`}
          >
            Day
          </button>
          <Link href="/week" className="px-4 py-1.5 rounded-md text-sm text-gray-500 border border-gray-300">
            Week
          </Link>
        </div>

        <p className="text-sm text-gray-500 mb-2">{today}</p>
        <button
          onClick={() => setPreviewTomorrow((p) => !p)}
          className="text-xs text-blue-600 hover:underline mb-6"
        >
          {previewTomorrow ? "← Back to today" : "Preview tomorrow's view (testing only)"}
        </button>

        {error && <p className="text-xs text-red-600 mb-4">{error}</p>}

        {loading ? (
          <p className="text-sm text-gray-400">Loading tasks…</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-800">To-do list</h2>
                  <button
                    onClick={() => openAddModal("todo")}
                    className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50"
                  >
                    <FiPlus size={14} />
                  </button>
                </div>
                <div className="space-y-2">
                  {todoTasks.length === 0 ? (
                    <p className="text-xs text-gray-400">No tasks yet</p>
                  ) : (
                    todoTasks.map((t) => <TaskCard key={t.id} task={t} listKey="todo" />)
                  )}
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-800">Task done today</h2>
                  <button
                    onClick={() => openAddModal("done")}
                    className="flex items-center gap-1 bg-green-700 text-white text-xs px-3 py-1.5 rounded-md hover:bg-green-800"
                  >
                    <FiPlus size={12} />
                    Add task
                  </button>
                </div>
                <div className="space-y-2">
                  {doneTasks.length === 0 ? (
                    <p className="text-xs text-gray-400">Nothing completed yet</p>
                  ) : (
                    doneTasks.map((t) => <TaskCard key={t.id} task={t} listKey="done" />)
                  )}
                </div>
              </div>
            </div>

            <div className="border border-blue-200 rounded-lg p-4">
              <h2 className="text-sm font-semibold text-blue-700 mb-3">Follow up from yesterday</h2>
              <div className="space-y-2">
                {followUps.length === 0 ? (
                  <p className="text-xs text-gray-400">Nothing carried over</p>
                ) : (
                  followUps.map((t) => <TaskCard key={t.id} task={t} listKey="followup" />)
                )}
              </div>
            </div>
          </>
        )}
      </main>

      <TaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        onDelete={editing ? handleDelete : undefined}
        onComplete={editing ? handleComplete : undefined}
        initialData={
          editing
            ? {
              tppi: editing.task.raw.tppi || "",
              category: editing.task.raw.category || "",
              task: editing.task.title,
              output: editing.task.raw.output || "",
              code: editing.task.raw.short_code || "",
              link: editing.task.raw.link || "",
              collaborators: editing.task.raw.collaborators?.join(", ") || "",
              timeTaken: editing.task.raw.time_taken?.slice(0, 5) || "",
              followUp: "neither",
            }
            : undefined
        }
      />
    </div>
  );
}