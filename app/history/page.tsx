"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { FiSearch, FiEye, FiDownload } from "react-icons/fi";

type HistoryReport = {
  id: string;
  weekRange: string;
  status: "submitted" | "reviewed";
  submittedOn: string;
};

// TODO(backend): replace with a real fetch from `weekly_reports`
// where status != 'draft', ordered by week_start desc, for the logged-in user.
const mockHistory: HistoryReport[] = [
  { id: "1", weekRange: "15 Apr – 18 Apr 2026", status: "reviewed", submittedOn: "18 Apr 2026" },
  { id: "2", weekRange: "8 Apr – 11 Apr 2026", status: "submitted", submittedOn: "11 Apr 2026" },
];

export default function HistoryPage() {
  const [query, setQuery] = useState("");

  const filtered = mockHistory.filter((r) =>
    r.weekRange.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />

      <main className="flex-1 p-6 pt-20 md:pt-6">
        <h1 className="text-lg font-semibold mb-4">History</h1>

        <div className="flex items-center gap-2 border border-gray-300 rounded-md px-3 py-2 mb-4 max-w-md">
          <FiSearch size={14} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search by week range"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-sm outline-none"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="border border-gray-200 rounded-lg p-8 text-center max-w-sm">
            <p className="text-sm font-medium text-gray-700 mb-1">No reports found</p>
            <p className="text-xs text-gray-400">Submitted weekly reports will appear here</p>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-w-2xl">
            {filtered.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm text-gray-800">{r.weekRange}</p>
                  <p className="text-xs text-gray-400">Submitted {r.submittedOn}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded ${
                      r.status === "reviewed" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {r.status === "reviewed" ? "Reviewed" : "Submitted"}
                  </span>
                  <button className="text-gray-400 hover:text-gray-700" aria-label="View report">
                    <FiEye size={15} />
                  </button>
                  <button className="text-gray-400 hover:text-gray-700" aria-label="Download report">
                    <FiDownload size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}