"use client";

import { useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import TaskModal, { TaskFormData } from "@/components/TaskModal";
import { FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";

type Task = { id: string; title: string };
type ListKey = "todo" | "done" | "followup";

const initialTodo: Task[] = [
  { id: "1", title: "Draft the blog outline" },
  { id: "2", title: "Review analytics dashboard" },
];

const initialDone: Task[] = [
  { id: "3", title: "Task-1: Fixed navbar spacing" },
  { id: "4", title: "Task-2: Uploaded infographic" },
  { id: "5", title: "Task-3: Replied to comments" },
];

const initialFollowUps: Task[] = [
  { id: "6", title: "Follow up on UDA meeting notes" },
];

export default function DayTabPage() {
  const [tab, setTab] = useState<"day" | "week">("day");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<{ listKey: ListKey; task: Task } | null>(null);
  const [addTargetList, setAddTargetList] = useState<ListKey>("todo");

  const [todoTasks, setTodoTasks] = useState<Task[]>(initialTodo);
  const [doneTasks, setDoneTasks] = useState<Task[]>(initialDone);
  const [followUps, setFollowUps] = useState<Task[]>(initialFollowUps);

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

function handleSave(data: TaskFormData) {
  const isMarkedFollowUp = data.followUp !== "neither";

  if (editing) {
    // Update the task's title in its current list
    listSetter(editing.listKey)((prev) =>
      prev.map((t) => (t.id === editing.task.id ? { ...t, title: data.task || t.title } : t))
    );

    // If it was just marked as a follow-up, also carry it into the follow-up list
    if (isMarkedFollowUp && editing.listKey !== "followup") {
      setFollowUps((prev) => [...prev, { ...editing.task, title: data.task || editing.task.title }]);
    }
  } else {
    const newTask: Task = { id: crypto.randomUUID(), title: data.task || "Untitled task" };
    listSetter(addTargetList)((prev) => [...prev, newTask]);

    // A brand-new task marked as follow-up also gets carried into tomorrow's list
    if (isMarkedFollowUp && addTargetList !== "followup") {
      setFollowUps((prev) => [...prev, { ...newTask, id: crypto.randomUUID() }]);
    }
  }
}

  function handleDelete() {
    if (!editing) return;
    listSetter(editing.listKey)((prev) => prev.filter((t) => t.id !== editing.task.id));
  }

  function handleComplete() {
    if (!editing) return;
    listSetter(editing.listKey)((prev) => prev.filter((t) => t.id !== editing.task.id));
    if (editing.listKey !== "done") {
      setDoneTasks((prev) => [...prev, editing.task]);
    }
  }

  function TaskCard({ task, listKey }: { task: Task; listKey: ListKey }) {
    return (
      <div className="group relative text-sm text-gray-700 border border-gray-100 rounded-md px-3 py-2 bg-gray-50 hover:bg-gray-100 cursor-pointer">
        <button onClick={() => openEditModal(listKey, task)} className="w-full text-left pr-12">
          {task.title}
        </button>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => openEditModal(listKey, task)}
            className="p-1 rounded hover:bg-gray-200 text-gray-500"
            aria-label="Edit task"
          >
            <FiEdit2 size={13} />
          </button>
          <button
            onClick={() => listSetter(listKey)((prev) => prev.filter((t) => t.id !== task.id))}
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
              {doneTasks.map((t) => <TaskCard key={t.id} task={t} listKey="done" />)}
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