"use client";

import { useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { FiPlus, FiTrash2, FiEye, FiDownload, FiSend } from "react-icons/fi";

type PlannedTask = {
  id: string; task: string; code: string; collaborators: string;
  importance: string; urgency: string; estTime: string; progress: string; weeks: string;
};
type NextWeekTask = {
  id: string; task: string; code: string; collaborators: string;
  importance: string; urgency: string; estTime: string; weeks: string;
};
type ReportRow = {
  id: string; tppi: string; category: string; task: string; output: string;
  collaborators: string; timeTaken: string; code: string; followUp: string;
};
type AttendanceRow = { day: string; date: string; hoursWorked: string; leaveType: string };
type BookRow = { id: string; author: string; title: string; pages: string };
type CompositionRow = { id: string; topic: string; pages: string; words: string; reviewedBy: string };

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const leaveOptions = ["None", "Short Leave", "Half Day", "Sick or Medical Leave"];

function newId() {
  return crypto.randomUUID();
}

export default function WeekTabPage() {
  const [tab, setTab] = useState<"day" | "week">("week");
  const [name, setName] = useState("");
  const [weekStart, setWeekStart] = useState("");
  const [weekEnd, setWeekEnd] = useState("");
  const [comingSoonMsg, setComingSoonMsg] = useState("");

  const [plannedThisWeek, setPlannedThisWeek] = useState<PlannedTask[]>([
    { id: newId(), task: "", code: "", collaborators: "", importance: "", urgency: "", estTime: "", progress: "", weeks: "" },
  ]);
  const [reportRows, setReportRows] = useState<ReportRow[]>([
    { id: newId(), tppi: "", category: "", task: "", output: "", collaborators: "", timeTaken: "", code: "", followUp: "" },
  ]);
  const [plannedNextWeek, setPlannedNextWeek] = useState<NextWeekTask[]>([
    { id: newId(), task: "", code: "", collaborators: "", importance: "", urgency: "", estTime: "", weeks: "" },
  ]);
  const [tbConsulted, setTbConsulted] = useState("");
  const [attendance, setAttendance] = useState<AttendanceRow[]>(
    days.map((day) => ({ day, date: "", hoursWorked: "", leaveType: "None" }))
  );
  const [books, setBooks] = useState<BookRow[]>([
    { id: newId(), author: "", title: "", pages: "" },
  ]);
  const [compositions, setCompositions] = useState<CompositionRow[]>([
    { id: newId(), topic: "", pages: "", words: "", reviewedBy: "" },
  ]);
  const [supervisorFeedback, setSupervisorFeedback] = useState("");
  const [dateSubmitted, setDateSubmitted] = useState("");
  const [dateResponded, setDateResponded] = useState("");

  const totalHours = attendance.reduce((sum, row) => sum + (parseFloat(row.hoursWorked) || 0), 0);

  function cellInput(value: string, onChange: (v: string) => void, placeholder = "") {
    return (
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-xs px-2 py-1.5 border-none outline-none focus:bg-gray-50 rounded"
      />
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />

      <main className="flex-1 p-6 pt-20 md:pt-6 max-w-5xl">
        {/* Day / Week toggle */}
        <div className="flex gap-2 mb-4">
          <Link href="/day" className="px-4 py-1.5 rounded-md text-sm text-gray-500 border border-gray-300">
            Day
          </Link>
          <button
            onClick={() => setTab("week")}
            className="px-4 py-1.5 rounded-md text-sm font-medium bg-green-50 text-green-700"
          >
            Week
          </button>
        </div>

        {/* Name + week range */}
        <div className="flex flex-wrap gap-3 items-center mb-6 text-sm">
          <input
            type="text"
            placeholder="Name / init"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
          />
          <input
            type="date"
            value={weekStart}
            onChange={(e) => setWeekStart(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
          />
          <span className="text-gray-400">to</span>
          <input
            type="date"
            value={weekEnd}
            onChange={(e) => setWeekEnd(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
          />
        </div>

        {/* Planned tasks for the week */}
        <SectionHeading title="Planned tasks for the week" />
        <TableWrapper>
          <thead>
            <tr>
              {["Task", "TB/OSF/Blog code", "Collaborators", "Importance (1-5)", "Urgency (1-5)", "Est. time", "% Progress", "# weeks", ""].map((h) => (
                <Th key={h}>{h}</Th>
              ))}
            </tr>
          </thead>
          <tbody>
            {plannedThisWeek.map((row) => (
              <tr key={row.id} className="border-t border-gray-100">
                <Td>{cellInput(row.task, (v) => setPlannedThisWeek((p) => p.map((r) => (r.id === row.id ? { ...r, task: v } : r))))}</Td>
                <Td>{cellInput(row.code, (v) => setPlannedThisWeek((p) => p.map((r) => (r.id === row.id ? { ...r, code: v } : r))))}</Td>
                <Td>{cellInput(row.collaborators, (v) => setPlannedThisWeek((p) => p.map((r) => (r.id === row.id ? { ...r, collaborators: v } : r))))}</Td>
                <Td>{cellInput(row.importance, (v) => setPlannedThisWeek((p) => p.map((r) => (r.id === row.id ? { ...r, importance: v } : r))))}</Td>
                <Td>{cellInput(row.urgency, (v) => setPlannedThisWeek((p) => p.map((r) => (r.id === row.id ? { ...r, urgency: v } : r))))}</Td>
                <Td>{cellInput(row.estTime, (v) => setPlannedThisWeek((p) => p.map((r) => (r.id === row.id ? { ...r, estTime: v } : r))))}</Td>
                <Td>{cellInput(row.progress, (v) => setPlannedThisWeek((p) => p.map((r) => (r.id === row.id ? { ...r, progress: v } : r))))}</Td>
                <Td>{cellInput(row.weeks, (v) => setPlannedThisWeek((p) => p.map((r) => (r.id === row.id ? { ...r, weeks: v } : r))))}</Td>
                <DeleteCell onClick={() => setPlannedThisWeek((p) => p.filter((r) => r.id !== row.id))} />
              </tr>
            ))}
          </tbody>
        </TableWrapper>
        <AddRowButton onClick={() => setPlannedThisWeek((p) => [...p, { id: newId(), task: "", code: "", collaborators: "", importance: "", urgency: "", estTime: "", progress: "", weeks: "" }])} />

        {/* Weekly report */}
        <SectionHeading title="Weekly report" />
        <TableWrapper>
          <thead>
            <tr>
              {["TPPI", "Category", "Task", "Output", "Collaborators", "Time taken", "Code (TB/OSF/Blog)", "Follow up / next steps", ""].map((h) => (
                <Th key={h}>{h}</Th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reportRows.map((row) => (
              <tr key={row.id} className="border-t border-gray-100">
                <Td>{cellInput(row.tppi, (v) => setReportRows((p) => p.map((r) => (r.id === row.id ? { ...r, tppi: v } : r))))}</Td>
                <Td>{cellInput(row.category, (v) => setReportRows((p) => p.map((r) => (r.id === row.id ? { ...r, category: v } : r))))}</Td>
                <Td>{cellInput(row.task, (v) => setReportRows((p) => p.map((r) => (r.id === row.id ? { ...r, task: v } : r))))}</Td>
                <Td>{cellInput(row.output, (v) => setReportRows((p) => p.map((r) => (r.id === row.id ? { ...r, output: v } : r))))}</Td>
                <Td>{cellInput(row.collaborators, (v) => setReportRows((p) => p.map((r) => (r.id === row.id ? { ...r, collaborators: v } : r))))}</Td>
                <Td>{cellInput(row.timeTaken, (v) => setReportRows((p) => p.map((r) => (r.id === row.id ? { ...r, timeTaken: v } : r))))}</Td>
                <Td>
                  {row.code ? (
                    <a href="#" className="text-xs text-blue-600 underline px-2">{row.code}</a>
                  ) : (
                    cellInput(row.code, (v) => setReportRows((p) => p.map((r) => (r.id === row.id ? { ...r, code: v } : r))), "Code")
                  )}
                </Td>
                <Td>{cellInput(row.followUp, (v) => setReportRows((p) => p.map((r) => (r.id === row.id ? { ...r, followUp: v } : r))))}</Td>
                <DeleteCell onClick={() => setReportRows((p) => p.filter((r) => r.id !== row.id))} />
              </tr>
            ))}
          </tbody>
        </TableWrapper>
        <AddRowButton onClick={() => setReportRows((p) => [...p, { id: newId(), tppi: "", category: "", task: "", output: "", collaborators: "", timeTaken: "", code: "", followUp: "" }])} />

        {/* Planned tasks for next week */}
        <SectionHeading title="Planned tasks for next week" />
        <TableWrapper>
          <thead>
            <tr>
              {["Task", "TB/OSF/Blog code", "Collaborators", "Importance (1-5)", "Urgency (1-5)", "Est. time", "# weeks", ""].map((h) => (
                <Th key={h}>{h}</Th>
              ))}
            </tr>
          </thead>
          <tbody>
            {plannedNextWeek.map((row) => (
              <tr key={row.id} className="border-t border-gray-100">
                <Td>{cellInput(row.task, (v) => setPlannedNextWeek((p) => p.map((r) => (r.id === row.id ? { ...r, task: v } : r))))}</Td>
                <Td>{cellInput(row.code, (v) => setPlannedNextWeek((p) => p.map((r) => (r.id === row.id ? { ...r, code: v } : r))))}</Td>
                <Td>{cellInput(row.collaborators, (v) => setPlannedNextWeek((p) => p.map((r) => (r.id === row.id ? { ...r, collaborators: v } : r))))}</Td>
                <Td>{cellInput(row.importance, (v) => setPlannedNextWeek((p) => p.map((r) => (r.id === row.id ? { ...r, importance: v } : r))))}</Td>
                <Td>{cellInput(row.urgency, (v) => setPlannedNextWeek((p) => p.map((r) => (r.id === row.id ? { ...r, urgency: v } : r))))}</Td>
                <Td>{cellInput(row.estTime, (v) => setPlannedNextWeek((p) => p.map((r) => (r.id === row.id ? { ...r, estTime: v } : r))))}</Td>
                <Td>{cellInput(row.weeks, (v) => setPlannedNextWeek((p) => p.map((r) => (r.id === row.id ? { ...r, weeks: v } : r))))}</Td>
                <DeleteCell onClick={() => setPlannedNextWeek((p) => p.filter((r) => r.id !== row.id))} />
              </tr>
            ))}
          </tbody>
        </TableWrapper>
        <AddRowButton onClick={() => setPlannedNextWeek((p) => [...p, { id: newId(), task: "", code: "", collaborators: "", importance: "", urgency: "", estTime: "", weeks: "" }])} />
        <p className="text-xs text-gray-400 mt-1 mb-6">
          # weeks = how many weeks this task has been carried over. If it's new or not carried over, use 0.
        </p>

        {/* TB Consulted */}
        <SectionHeading title="TB consulted" />
        <textarea
          value={tbConsulted}
          onChange={(e) => setTbConsulted(e.target.value)}
          placeholder="List the TB tasks you consulted this week (filtered from your TB board)"
          rows={3}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-6"
        />

        {/* Reporting statistics / attendance */}
        <SectionHeading title="Reporting statistics — attendance" />
        <TableWrapper>
          <thead>
            <tr>
              {["Date", "Day", "Hours worked", "Leave type"].map((h) => (
                <Th key={h}>{h}</Th>
              ))}
            </tr>
          </thead>
          <tbody>
            {attendance.map((row, i) => (
              <tr key={row.day} className="border-t border-gray-100">
                <Td>
                  <input
                    type="date"
                    value={row.date}
                    onChange={(e) =>
                      setAttendance((prev) => prev.map((r, idx) => (idx === i ? { ...r, date: e.target.value } : r)))
                    }
                    className="w-full text-xs px-2 py-1.5 border-none outline-none focus:bg-gray-50 rounded"
                  />
                </Td>
                <Td><span className="text-xs text-gray-600 px-2">{row.day}</span></Td>
                <Td>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={row.hoursWorked}
                    onChange={(e) =>
                      setAttendance((prev) => prev.map((r, idx) => (idx === i ? { ...r, hoursWorked: e.target.value } : r)))
                    }
                    className="w-full text-xs px-2 py-1.5 border-none outline-none focus:bg-gray-50 rounded"
                  />
                </Td>
                <Td>
                  <select
                    value={row.leaveType}
                    onChange={(e) =>
                      setAttendance((prev) => prev.map((r, idx) => (idx === i ? { ...r, leaveType: e.target.value } : r)))
                    }
                    className="w-full text-xs px-2 py-1.5 border-none outline-none focus:bg-gray-50 rounded"
                  >
                    {leaveOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </Td>
              </tr>
            ))}
            <tr className="border-t border-gray-200 bg-gray-50 font-medium">
              <Td colSpan={2}><span className="px-2 text-xs">TOTAL</span></Td>
              <Td><span className="px-2 text-xs">{totalHours}</span></Td>
              <Td><span></span></Td>
            </tr>
          </tbody>
        </TableWrapper>
        <p className="text-xs text-gray-400 mt-1 mb-6">
          Short Leave, Half Day, and Sick or Medical Leave are the recognized leave types.
        </p>

        {/* Books read */}
        <SectionHeading title="Books read" />
        <TableWrapper>
          <thead>
            <tr>
              {["Author", "Title", "Pages or chapters", ""].map((h) => (
                <Th key={h}>{h}</Th>
              ))}
            </tr>
          </thead>
          <tbody>
            {books.map((row) => (
              <tr key={row.id} className="border-t border-gray-100">
                <Td>{cellInput(row.author, (v) => setBooks((p) => p.map((r) => (r.id === row.id ? { ...r, author: v } : r))))}</Td>
                <Td>{cellInput(row.title, (v) => setBooks((p) => p.map((r) => (r.id === row.id ? { ...r, title: v } : r))))}</Td>
                <Td>{cellInput(row.pages, (v) => setBooks((p) => p.map((r) => (r.id === row.id ? { ...r, pages: v } : r))))}</Td>
                <DeleteCell onClick={() => setBooks((p) => p.filter((r) => r.id !== row.id))} />
              </tr>
            ))}
          </tbody>
        </TableWrapper>
        <AddRowButton onClick={() => setBooks((p) => [...p, { id: newId(), author: "", title: "", pages: "" }])} />

        {/* Composition */}
        <SectionHeading title="Composition" />
        <TableWrapper>
          <thead>
            <tr>
              {["Topic", "Pages", "Words", "Reviewed by", ""].map((h) => (
                <Th key={h}>{h}</Th>
              ))}
            </tr>
          </thead>
          <tbody>
            {compositions.map((row) => (
              <tr key={row.id} className="border-t border-gray-100">
                <Td>{cellInput(row.topic, (v) => setCompositions((p) => p.map((r) => (r.id === row.id ? { ...r, topic: v } : r))))}</Td>
                <Td>{cellInput(row.pages, (v) => setCompositions((p) => p.map((r) => (r.id === row.id ? { ...r, pages: v } : r))))}</Td>
                <Td>{cellInput(row.words, (v) => setCompositions((p) => p.map((r) => (r.id === row.id ? { ...r, words: v } : r))))}</Td>
                <Td>{cellInput(row.reviewedBy, (v) => setCompositions((p) => p.map((r) => (r.id === row.id ? { ...r, reviewedBy: v } : r))))}</Td>
                <DeleteCell onClick={() => setCompositions((p) => p.filter((r) => r.id !== row.id))} />
              </tr>
            ))}
          </tbody>
        </TableWrapper>
        <AddRowButton onClick={() => setCompositions((p) => [...p, { id: newId(), topic: "", pages: "", words: "", reviewedBy: "" }])} />

        {/* Supervisor section */}
        <SectionHeading title="Supervisor section" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Date submitted to supervisor</label>
            <input
              type="date"
              value={dateSubmitted}
              onChange={(e) => setDateSubmitted(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Date responded</label>
            <input
              type="date"
              value={dateResponded}
              onChange={(e) => setDateResponded(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="mb-8">
          <label className="block text-xs text-gray-500 mb-1">Supervisor feedback</label>
          <textarea
            value={supervisorFeedback}
            onChange={(e) => setSupervisorFeedback(e.target.value)}
            
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>

        {/* Actions */}
        {comingSoonMsg && <p className="text-xs text-amber-700 text-right mb-2">{comingSoonMsg}</p>}
        <div className="flex flex-wrap gap-2 justify-end pb-10">
          <button className="text-sm px-3 py-1.5 border border-red-300 text-red-600 rounded-md hover:bg-red-50">
            Delete
          </button>
          <button className="text-sm px-3 py-1.5 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 flex items-center gap-1">
            <FiEye size={14} /> Preview
          </button>
          <button
            onClick={() => {
              setComingSoonMsg("PDF/Excel export is coming soon.");
              setTimeout(() => setComingSoonMsg(""), 3000);
            }}
            className="text-sm px-3 py-1.5 border border-gray-300 rounded-md text-gray-500 hover:bg-gray-50 flex items-center gap-1"
          >
            <FiDownload size={14} /> Download (PDF / DOCX)
          </button>
          <button className="text-sm px-3 py-1.5 bg-green-700 text-white rounded-md hover:bg-green-800 flex items-center gap-1">
            <FiSend size={14} /> Submit
          </button>
        </div>
      </main>
    </div>
  );
}

// --- Small helper components, kept in this file for now ---

function SectionHeading({ title }: { title: string }) {
  return <h2 className="text-sm font-semibold text-gray-800 mt-6 mb-2">{title}</h2>;
}

function TableWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-x-auto">
      <table className="w-full border-collapse min-w-[700px]">{children}</table>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left text-xs font-medium text-gray-500 bg-gray-50 px-2 py-2 whitespace-nowrap">
      {children}
    </th>
  );
}

function Td({ children, colSpan }: { children: React.ReactNode; colSpan?: number }) {
  return (
    <td colSpan={colSpan} className="align-middle">
      {children}
    </td>
  );
}

function DeleteCell({ onClick }: { onClick: () => void }) {
  return (
    <td className="w-8">
      <button onClick={onClick} className="text-gray-300 hover:text-red-500 p-1" aria-label="Delete row">
        <FiTrash2 size={13} />
      </button>
    </td>
  );
}

function AddRowButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="mt-2 mb-6 flex items-center gap-1 text-xs text-blue-600 hover:underline"
    >
      <FiPlus size={12} /> Add row
    </button>
  );
}