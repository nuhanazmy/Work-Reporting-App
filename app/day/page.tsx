"use client";

import { useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { FiPlus } from "react-icons/fi";

type Task = { id: string; title: string };

const todoTasks: Task[] = [
  { id: "1", title: "Draft the blog outline" },
  { id: "2", title: "Review analytics dashboard" },
];

const doneTasks: Task[] = [
  { id: "3", title: "Task-1: Fixed navbar spacing" },
  { id: "4", title: "Task-2: Uploaded infographic" },
  { id: "5", title: "Task-3: Replied to comments" },
];

const followUps: Task[] = [
  { id: "6", title: "Follow up on UDA meeting notes" },
];

export default function DayTabPage() {
  const [tab, setTab] = useState<"day" | "week">("day");
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

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
              {doneTasks.map((t) => (
                <div key={t.id} className="text-sm text-gray-700 border border-gray-100 rounded-md px-3 py-2 bg-gray-50">
                  {t.title}
                </div>
              ))}
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
      </main>
    </div>
  );
}