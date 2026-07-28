"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { FiPlus } from "react-icons/fi";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Task = { id: string; title: string };

export default function DayTabPage() {
  const [tab, setTab] = useState<"day" | "week">("day");
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

  useEffect(() => {
    async function loadTasks() {
      setLoading(true);
      setError("");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // Matches Postgres "date" format (YYYY-MM-DD) in the user's local timezone
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
          tasks
            .filter((t) => t.status === "pending")
            .map((t) => ({ id: t.id, title: t.task }))
        );
        setDoneTasks(
          tasks
            .filter((t) => t.status === "completed")
            .map((t) => ({ id: t.id, title: t.task }))
        );
        setFollowUps(
          tasks
            .filter((t) => t.is_follow_up)
            .map((t) => ({ id: t.id, title: t.task }))
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
        {/* Day / Week toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab("day")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium ${
              tab === "day" ? "bg-green-50 text-green-700" : "text-gray-500 border border-gray-300"
            }`}
          >
            Day
          </button>
          <Link
            href="/week"
            className="px-4 py-1.5 rounded-md text-sm text-gray-500 border border-gray-300"
          >
            Week
          </Link>
        </div>

        <p className="text-sm text-gray-500 mb-6">{today}</p>

        {error && <p className="text-xs text-red-600 mb-4">{error}</p>}

        {loading ? (
          <p className="text-sm text-gray-400">Loading tasks…</p>
        ) : (
          <>
            {/* Two columns: To-do list / Task done today */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* To-do list */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-800">To-do list</h2>
                  <button
                    onClick={() => console.log("Open add task modal")}
                    className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50"
                  >
                    <FiPlus size={14} />
                  </button>
                </div>
                <div className="space-y-2">
                  {todoTasks.length === 0 ? (
                    <p className="text-xs text-gray-400">No tasks yet</p>
                  ) : (
                    todoTasks.map((t) => (
                      <div key={t.id} className="text-sm text-gray-700 border border-gray-100 rounded-md px-3 py-2 bg-gray-50">
                        {t.title}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Task done today */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-800">Task done today</h2>
                  <button
                    onClick={() => console.log("Open add task modal")}
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
                    doneTasks.map((t) => (
                      <div key={t.id} className="text-sm text-gray-700 border border-gray-100 rounded-md px-3 py-2 bg-gray-50">
                        {t.title}
                      </div>
                    ))
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
                  followUps.map((t) => (
                    <div key={t.id} className="text-sm text-gray-700 border border-blue-100 rounded-md px-3 py-2 bg-blue-50">
                      {t.title}
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}