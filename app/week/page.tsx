"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/client";
import { FiPlus, FiTrash2, FiEye, FiDownload, FiSend } from "react-icons/fi";

/* ------------------------------------------------------------------ */
/* NOTE: enum literal values below are ASSUMED from column names.      */
/* Confirm the real values in Postgres and fix these maps if they      */
/* don't match, e.g.:                                                  */
/*   select enum_range(null::plan_week_type);                          */
/*   select enum_range(null::leave_type);                              */
/*   select enum_range(null::report_status);                           */
/* ------------------------------------------------------------------ */

const WEEK_TYPE_THIS = "this_week";
const WEEK_TYPE_NEXT = "next_week";

const leaveTypeToDb: Record<string, string> = {
  "None": "none",
  "Short Leave": "short_leave",
  "Half Day": "half_day",
  "Sick or Medical Leave": "sick_medical",
};
const leaveTypeFromDb: Record<string, string> = Object.fromEntries(
  Object.entries(leaveTypeToDb).map(([label, db]) => [db, label])
);

type PlannedTask = {
  id: string; // real uuid once saved, temp id before that
  task: string; code: string; collaborators: string;
  importance: string; urgency: string; estTime: string; progress: string; weeks: string;
};
type NextWeekTask = {
  id: string;
  task: string; code: string; collaborators: string;
  importance: string; urgency: string; estTime: string; weeks: string;
};
// Read-only rollup of this week's completed daily_tasks — no dedicated table exists for this.
type ReportRow = {
  id: string; tppi: string; category: string; task: string; output: string;
  collaborators: string; timeTaken: string; code: string; followUp: string;
};
type AttendanceRow = { day: string; date: string; hoursWorked: string; leaveType: string };
type BookRow = { id: string; author: string; title: string; pages: string };
type CompositionRow = { id: string; topic: string; pages: string; words: string; reviewedBy: string };

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const leaveOptions = Object.keys(leaveTypeToDb);

function newId() {
  return crypto.randomUUID();
}

function isTempId(id: string) {
  // temp ids are never valid DB rows yet; real supabase uuids are always 36 chars w/ dashes
  // this just distinguishes "not yet inserted" rows created client-side before first save
  return id.startsWith("tmp_");
}

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Monday of the week containing `d`
function mondayOf(d: Date) {
  const date = new Date(d);
  const day = date.getDay(); // 0 = Sun
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date;
}

function defaultWeekRange() {
  const start = mondayOf(new Date());
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return { start: toDateStr(start), end: toDateStr(end) };
}

function emptyPlanned(): PlannedTask {
  return { id: `tmp_${newId()}`, task: "", code: "", collaborators: "", importance: "", urgency: "", estTime: "", progress: "", weeks: "" };
}
function emptyNextWeek(): NextWeekTask {
  return { id: `tmp_${newId()}`, task: "", code: "", collaborators: "", importance: "", urgency: "", estTime: "", weeks: "" };
}
function emptyAttendance(weekStart: string): AttendanceRow[] {
  const start = new Date(weekStart);
  return days.map((day, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return { day, date: toDateStr(d), hoursWorked: "", leaveType: "None" };
  });
}

export default function WeekTabPage() {
  const [tab] = useState<"day" | "week">("week");
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [name, setName] = useState(""); // pulled from profiles, read-only display
  const { start: defaultStart, end: defaultEnd } = defaultWeekRange();
  const [weekStart, setWeekStart] = useState(defaultStart);
  const [weekEnd, setWeekEnd] = useState(defaultEnd);

  const [reportId, setReportId] = useState<string | null>(null);
  const [reportStatus, setReportStatus] = useState<string>("draft");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [comingSoonMsg, setComingSoonMsg] = useState("");
  const [savedMsg, setSavedMsg] = useState("");

  const [plannedThisWeek, setPlannedThisWeek] = useState<PlannedTask[]>([emptyPlanned()]);
  const [plannedNextWeek, setPlannedNextWeek] = useState<NextWeekTask[]>([emptyNextWeek()]);
  const [reportRows, setReportRows] = useState<ReportRow[]>([]); // read-only rollup, see loadReportRows
  const [attendance, setAttendance] = useState<AttendanceRow[]>(emptyAttendance(defaultStart));

  // Not backed by any table yet — kept local-only until books_read / compositions tables exist.
  const [books, setBooks] = useState<BookRow[]>([{ id: newId(), author: "", title: "", pages: "" }]);
  const [compositions, setCompositions] = useState<CompositionRow[]>([
    { id: newId(), topic: "", pages: "", words: "", reviewedBy: "" },
  ]);

  const [tbConsulted, setTbConsulted] = useState("");
  const [supervisorFeedback, setSupervisorFeedback] = useState("");
  const [dateSubmitted, setDateSubmitted] = useState("");
  const [dateResponded, setDateResponded] = useState("");

  const totalHours = attendance.reduce((sum, row) => sum + (parseFloat(row.hoursWorked) || 0), 0);

  /* ---------------------------- LOAD ---------------------------- */

  const loadWeek = useCallback(async (start: string, end: string) => {
    setLoading(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    // profile name (display only)
    const { data: profile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .single();
    setName(profile?.name ?? "");

    // find this week's report
    const { data: report, error: reportError } = await supabase
      .from("weekly_reports")
      .select("id, status, supervisor_feedback, submitted_at, date_responded")
      .eq("user_id", user.id)
      .eq("week_start", start)
      .is("deleted_at", null)
      .maybeSingle();

    if (reportError) {
      setError(reportError.message);
      setLoading(false);
      return;
    }

    if (!report) {
      // no report yet for this week — reset to blank state, nothing to load
      setReportId(null);
      setReportStatus("draft");
      setSupervisorFeedback("");
      setDateSubmitted("");
      setDateResponded("");
      setPlannedThisWeek([emptyPlanned()]);
      setPlannedNextWeek([emptyNextWeek()]);
      setAttendance(emptyAttendance(start));
      await loadReportRows(user.id, start, end);
      setLoading(false);
      return;
    }

    setReportId(report.id);
    setReportStatus(report.status ?? "draft");
    setSupervisorFeedback(report.supervisor_feedback ?? "");
    setDateSubmitted(report.submitted_at ? report.submitted_at.slice(0, 10) : "");
    setDateResponded(report.date_responded ? report.date_responded.slice(0, 10) : "");

    // planned_tasks for this report, split by week_type
    const { data: planned, error: plannedError } = await supabase
      .from("planned_tasks")
      .select("id, week_type, task, short_code, collaborators, importance, urgency, estimated_time, progress_percent, weeks_count")
      .eq("report_id", report.id)
      .is("deleted_at", null);

    if (plannedError) {
      setError(plannedError.message);
    } else if (planned) {
      const thisWeekRows = planned
        .filter((p) => p.week_type === WEEK_TYPE_THIS)
        .map((p): PlannedTask => ({
          id: p.id,
          task: p.task ?? "",
          code: p.short_code ?? "",
          collaborators: (p.collaborators ?? []).join(", "),
          importance: p.importance != null ? String(p.importance) : "",
          urgency: p.urgency != null ? String(p.urgency) : "",
          estTime: p.estimated_time ?? "",
          progress: p.progress_percent != null ? String(p.progress_percent) : "",
          weeks: p.weeks_count != null ? String(p.weeks_count) : "",
        }));
      const nextWeekRows = planned
        .filter((p) => p.week_type === WEEK_TYPE_NEXT)
        .map((p): NextWeekTask => ({
          id: p.id,
          task: p.task ?? "",
          code: p.short_code ?? "",
          collaborators: (p.collaborators ?? []).join(", "),
          importance: p.importance != null ? String(p.importance) : "",
          urgency: p.urgency != null ? String(p.urgency) : "",
          estTime: p.estimated_time ?? "",
          weeks: p.weeks_count != null ? String(p.weeks_count) : "",
        }));
      setPlannedThisWeek(thisWeekRows.length ? thisWeekRows : [emptyPlanned()]);
      setPlannedNextWeek(nextWeekRows.length ? nextWeekRows : [emptyNextWeek()]);
    }

    // attendance for this report
    const { data: attendanceRows, error: attendanceError } = await supabase
      .from("attendance")
      .select("work_date, hours_worked, leave_type")
      .eq("report_id", report.id);

    if (attendanceError) {
      setError(attendanceError.message);
    } else {
      const template = emptyAttendance(start);
      const byDate = new Map((attendanceRows ?? []).map((r) => [r.work_date, r]));
      setAttendance(
        template.map((row) => {
          const match = byDate.get(row.date);
          if (!match) return row;
          return {
            ...row,
            hoursWorked: match.hours_worked != null ? String(match.hours_worked) : "",
            leaveType: leaveTypeFromDb[match.leave_type] ?? "None",
          };
        })
      );
    }

    await loadReportRows(user.id, start, end);
    setLoading(false);
  }, [supabase, router]);

  // Read-only rollup: completed daily_tasks within [start, end]
  async function loadReportRows(userId: string, start: string, end: string) {
    const { data, error: taskError } = await supabase
      .from("daily_tasks")
      .select("id, tppi, category, task, output, collaborators, time_taken, short_code")
      .eq("user_id", userId)
      .eq("status", "completed")
      .gte("task_date", start)
      .lte("task_date", end)
      .is("deleted_at", null);

    if (taskError) {
      setError(taskError.message);
      return;
    }

    setReportRows(
      (data ?? []).map((t): ReportRow => ({
        id: t.id,
        tppi: t.tppi ?? "",
        category: t.category ?? "",
        task: t.task,
        output: t.output ?? "",
        collaborators: (t.collaborators ?? []).join(", "),
        timeTaken: t.time_taken ? String(t.time_taken).slice(0, 5) : "",
        code: t.short_code ?? "",
        followUp: "", // no matching column on daily_tasks for this
      }))
    );
  }

  useEffect(() => {
    loadWeek(weekStart, weekEnd);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleWeekChange(newStart: string, newEnd: string) {
    setWeekStart(newStart);
    setWeekEnd(newEnd);
    loadWeek(newStart, newEnd);
  }

  /* ---------------------------- SAVE ---------------------------- */

  async function ensureReport(userId: string, status?: string) {
    const payload: Record<string, unknown> = {
      user_id: userId,
      week_start: weekStart,
      week_end: weekEnd,
      supervisor_feedback: supervisorFeedback || null,
      date_responded: dateResponded || null,
    };
    if (status) payload.status = status;
    if (status === "submitted") payload.submitted_at = new Date().toISOString();

    const { data, error: upsertError } = await supabase
      .from("weekly_reports")
      .upsert(payload, { onConflict: "user_id,week_start" })
      .select("id, status")
      .single();

    if (upsertError) throw upsertError;
    setReportId(data.id);
    setReportStatus(data.status);
    return data.id as string;
  }

  async function savePlannedTasks(reportIdVal: string) {
    // Simplest correct approach: replace all rows for this report + week_type each save.
    const thisWeekPayload = plannedThisWeek
      .filter((r) => r.task.trim())
      .map((r) => ({
        report_id: reportIdVal,
        week_type: WEEK_TYPE_THIS,
        task: r.task,
        short_code: r.code || null,
        collaborators: r.collaborators ? r.collaborators.split(",").map((c) => c.trim()) : null,
        importance: r.importance ? Number(r.importance) : null,
        urgency: r.urgency ? Number(r.urgency) : null,
        estimated_time: r.estTime || null,
        progress_percent: r.progress ? Number(r.progress) : null,
        weeks_count: r.weeks ? Number(r.weeks) : null,
      }));
    const nextWeekPayload = plannedNextWeek
      .filter((r) => r.task.trim())
      .map((r) => ({
        report_id: reportIdVal,
        week_type: WEEK_TYPE_NEXT,
        task: r.task,
        short_code: r.code || null,
        collaborators: r.collaborators ? r.collaborators.split(",").map((c) => c.trim()) : null,
        importance: r.importance ? Number(r.importance) : null,
        urgency: r.urgency ? Number(r.urgency) : null,
        estimated_time: r.estTime || null,
        weeks_count: r.weeks ? Number(r.weeks) : null,
      }));

    // wipe existing rows for this report (soft-consistent since it's a full-form save)
    const { error: delError } = await supabase
      .from("planned_tasks")
      .delete()
      .eq("report_id", reportIdVal);
    if (delError) throw delError;

    const combined = [...thisWeekPayload, ...nextWeekPayload];
    if (combined.length) {
      const { error: insError } = await supabase.from("planned_tasks").insert(combined);
      if (insError) throw insError;
    }
  }

  async function saveAttendance(reportIdVal: string) {
    const payload = attendance
      .filter((r) => r.date)
      .map((r) => ({
        report_id: reportIdVal,
        work_date: r.date,
        hours_worked: r.hoursWorked ? Number(r.hoursWorked) : 0,
        leave_type: leaveTypeToDb[r.leaveType] ?? "none",
      }));
    if (!payload.length) return;

    const { error: attError } = await supabase
      .from("attendance")
      .upsert(payload, { onConflict: "report_id,work_date" });
    if (attError) throw attError;
  }

  async function handleSaveAll(statusOverride?: string) {
    setSaving(true);
    setError("");
    setSavedMsg("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      const id = await ensureReport(user.id, statusOverride);
      await savePlannedTasks(id);
      await saveAttendance(id);
      setSavedMsg(statusOverride === "submitted" ? "Report submitted." : "Draft saved.");
      setTimeout(() => setSavedMsg(""), 3000);
      await loadWeek(weekStart, weekEnd);
    } catch (e: any) {
      setError(e.message ?? "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteReport() {
    if (!reportId) return;
    setSaving(true);
    const { error: delError } = await supabase
      .from("weekly_reports")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", reportId);
    setSaving(false);
    if (delError) {
      setError(delError.message);
      return;
    }
    setReportId(null);
    setReportStatus("draft");
    await loadWeek(weekStart, weekEnd);
  }

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
          <button className="px-4 py-1.5 rounded-md text-sm font-medium bg-green-50 text-green-700">
            Week
          </button>
        </div>

        {/* Name (from profile, read-only) + week range */}
        <div className="flex flex-wrap gap-3 items-center mb-2 text-sm">
          <span className="border border-gray-200 bg-gray-50 rounded-md px-3 py-1.5 text-sm text-gray-600">
            {name || "—"}
          </span>
          <input
            type="date"
            value={weekStart}
            onChange={(e) => handleWeekChange(e.target.value, weekEnd)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
          />
          <span className="text-gray-400">to</span>
          <input
            type="date"
            value={weekEnd}
            onChange={(e) => handleWeekChange(weekStart, e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
          />
          <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 capitalize">{reportStatus}</span>
        </div>
        {loading && <p className="text-xs text-gray-400 mb-4">Loading week…</p>}
        {error && <p className="text-xs text-red-600 mb-4">{error}</p>}
        {savedMsg && <p className="text-xs text-green-700 mb-4">{savedMsg}</p>}

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
        <AddRowButton onClick={() => setPlannedThisWeek((p) => [...p, emptyPlanned()])} />

        {/* Weekly report — read-only rollup of completed daily_tasks, no dedicated table */}
        <SectionHeading title="Weekly report (completed tasks — read-only, pulled from Day tab)" />
        <TableWrapper>
          <thead>
            <tr>
              {["TPPI", "Category", "Task", "Output", "Collaborators", "Time taken", "Code (TB/OSF/Blog)"].map((h) => (
                <Th key={h}>{h}</Th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reportRows.length === 0 ? (
              <tr><td colSpan={7} className="text-xs text-gray-400 px-2 py-3">No completed tasks logged for this week yet.</td></tr>
            ) : (
              reportRows.map((row) => (
                <tr key={row.id} className="border-t border-gray-100">
                  <Td><span className="text-xs px-2">{row.tppi}</span></Td>
                  <Td><span className="text-xs px-2">{row.category}</span></Td>
                  <Td><span className="text-xs px-2">{row.task}</span></Td>
                  <Td><span className="text-xs px-2">{row.output}</span></Td>
                  <Td><span className="text-xs px-2">{row.collaborators}</span></Td>
                  <Td><span className="text-xs px-2">{row.timeTaken}</span></Td>
                  <Td><span className="text-xs px-2">{row.code}</span></Td>
                </tr>
              ))
            )}
          </tbody>
        </TableWrapper>

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
        <AddRowButton onClick={() => setPlannedNextWeek((p) => [...p, emptyNextWeek()])} />
        <p className="text-xs text-gray-400 mt-1 mb-6">
          # weeks = how many weeks this task has been carried over. If it's new or not carried over, use 0.
        </p>

        {/* TB Consulted — not backed by a table yet, kept local only */}
        <SectionHeading title="TB consulted (not saved yet — no table for this)" />
        <textarea
          value={tbConsulted}
          onChange={(e) => setTbConsulted(e.target.value)}
          placeholder="List the TB tasks you consulted this week (filtered from your TB board)"
          rows={3}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-6"
        />

        {/* Attendance */}
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
                <Td><span className="text-xs text-gray-500 px-2">{row.date}</span></Td>
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

        {/* Books read — not backed by a table yet */}
        <SectionHeading title="Books read (not saved yet — no table for this)" />
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

        {/* Composition — not backed by a table yet */}
        <SectionHeading title="Composition (not saved yet — no table for this)" />
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
              readOnly
              className="w-full border border-gray-200 bg-gray-50 rounded-md px-3 py-2 text-sm text-gray-500"
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
          <button
            onClick={handleDeleteReport}
            disabled={!reportId || saving}
            className="text-sm px-3 py-1.5 border border-red-300 text-red-600 rounded-md hover:bg-red-50 disabled:opacity-40"
          >
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
          <button
            onClick={() => handleSaveAll()}
            disabled={saving}
            className="text-sm px-3 py-1.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save draft"}
          </button>
          <button
            onClick={() => handleSaveAll("submitted")}
            disabled={saving}
            className="text-sm px-3 py-1.5 bg-green-700 text-white rounded-md hover:bg-green-800 flex items-center gap-1 disabled:opacity-40"
          >
            <FiSend size={14} /> Submit
          </button>
        </div>
      </main>
    </div>
  );
}

/* --- Small helper components --- */

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