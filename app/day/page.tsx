"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import TaskModal, { TaskFormData } from "@/components/TaskModal";
import { FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";
import { createClient } from "@/lib/supabase/client";
import { addDraft } from "@/lib/drafts";
import { moveToTrash } from "@/lib/trash";

type TaskStatus = "pending" | "completed" | "follow_up" | "draft";
type Task = { id: string; title: string; status: TaskStatus };
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

export default function DayTabPage() {
  const [tab, setTab] = useState<"day" | "week">("day");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<{ listKey: ListKey; task: Task } | null>(null);
  const [addTargetList, setAddTargetList] = useState<ListKey>("todo");
  const [draftMessage, setDraftMessage] = useState("");

  const [todoTasks, setTodoTasks] = useState<Task[]>([]);
  const [doneTasks, setDoneTasks] = useState<Task[]>([]);
  const [followUps, setFollowUps] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  function openAddModal(listKey: ListKey) {
    setEditing(null);
    setAddTargetList(listKey);
    setModalOpen(true);
  }

  function openEditModal(listKey: ListKey, task: Task) {
    setEditing({ listKey, task });
    setModalOpen(true);
  }

  function listSetter(listKey: ListKey) {
    if (listKey === "todo") return setTodoTasks;
    if (listKey === "done") return setDoneTasks;
    return setFollowUps;
  }

  function handleSave(data: TaskFormData, saveMode: "active" | "draft") {
    if (saveMode === "draft") {
      addDraft(data);
      setDraftMessage("Saved as draft — find it on the Drafts page.");
      setTimeout(() => setDraftMessage(""), 3000);
      return;
    }

    const isMarkedFollowUp = data.followUp !== "neither";
    const status: TaskStatus = isMarkedFollowUp ? "follow_up" : "pending";

    if (editing) {
      listSetter(editing.listKey)((prev) =>
        prev.map((t) => (t.id === editing.task.id ? { ...t, title: data.task || t.title, status } : t))
      );

      if (isMarkedFollowUp && editing.listKey !== "followup") {
        setFollowUps((prev) => [
          ...prev,
          { ...editing.task, title: data.task || editing.task.title, status: "follow_up" },
        ]);
      }
    } else {
      const newTask: Task = { id: crypto.randomUUID(), title: data.task || "Untitled task", status };
      listSetter(addTargetList)((prev) => [...prev, newTask]);

      if (isMarkedFollowUp && addTargetList !== "followup") {
        setFollowUps((prev) => [...prev, { ...newTask, id: crypto.randomUUID(), status: "follow_up" }]);
      }
    }
  }

  // Delete from inside the modal — moves to Trash instead of erasing
  function handleDelete() {
    if (!editing) return;
    moveToTrash(editing.task.title, editing.listKey);
    listSetter(editing.listKey)((prev) => prev.filter((t) => t.id !== editing.task.id));
  }

  function handleComplete() {
    if (!editing) return;
    listSetter(editing.listKey)((prev) => prev.filter((t) => t.id !== editing.task.id));
    if (editing.listKey !== "done") {
      setDoneTasks((prev) => [...prev, { ...editing.task, status: "completed" }]);
    }
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
            onClick={() => {
              // Hover delete icon — also moves to Trash instead of erasing
              moveToTrash(task.title, listKey);
              listSetter(listKey)((prev) => prev.filter((t) => t.id !== task.id));
            }}
            className="p-1 rounded hover:bg-red-100 text-red-500"
            aria-label="Delete task"
          >
            <FiTrash2 size={13} />
          </button>
        </div>
      </div>
    );
  }

  useEffect(() => {
    async function loadTasks() {
      setLoading(true);
      setError("");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

      const { data: tasks, error: fetchError } = await supabase
        .from("daily_tasks")
        .select("id, task, status, is_follow_up")
        .eq("user_id", user.id)
        .eq("task_date", todayStr)
        .is("deleted_at", null);

      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      if (tasks) {
        setTodoTasks(
          tasks.filter((t) => t.status === "pending").map((t) => ({ id: t.id, title: t.task, status: "pending" as TaskStatus }))
        );
        setDoneTasks(
          tasks.filter((t) => t.status === "completed").map((t) => ({ id: t.id, title: t.task, status: "completed" as TaskStatus }))
        );
        setFollowUps(
          tasks.filter((t) => t.is_follow_up).map((t) => ({ id: t.id, title: t.task, status: "follow_up" as TaskStatus }))
        );
      }

      setLoading(false);
    }

    loadTasks();
  }, []);

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />

      <main className="flex-1 p-6 pt-20 md:pt-6">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab("day")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium ${
              tab === "day" ? "bg-green-50 text-green-700" : "text-gray-500 border border-gray-300"
            }`}
          >
            Day
          </button>
          <Link href="/week" className="px-4 py-1.5 rounded-md text-sm text-gray-500 border border-gray-300">
            Week
          </Link>
        </div>

        <p className="text-sm text-gray-500 mb-6">{today}</p>

        {error && <p className="text-xs text-red-600 mb-4">{error}</p>}
        {draftMessage && <p className="text-xs text-amber-700 mb-4">{draftMessage}</p>}

        {loading ? (
          <p className="text-sm text-gray-400">Loading tasks…</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* To-do list */}
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

              {/* Task done today */}
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

            {/* Follow up from yesterday */}
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
                tppi: "",
                category: "",
                task: editing.task.title,
                output: "",
                code: "",
                link: "",
                collaborators: "",
                timeTaken: "",
                followUp: "neither",
              }
            : undefined
        }
      />
    </div>
  );
}