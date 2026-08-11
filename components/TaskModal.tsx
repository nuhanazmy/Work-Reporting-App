"use client";

import { useEffect, useState } from "react";
import { FiClock, FiExternalLink } from "react-icons/fi";

export type TaskFormData = {
  tppi: string;
  category: string;
  task: string;
  output: string;
  code: string;
  link: string;
  collaborators: string;
  timeTaken: string;
  followUp: "urgent_important" | "important" | "urgent" | "neither";
};

const tppiOptions = ["Blog", "Media", "Development", "Communication"];
const categoryOptions = ["Climate.MV", "HR", "Publication", "Internal"];
const codeOptions = ["TB-102", "TBOPE", "OSF-21", "TAIGA-4"];

const emptyForm: TaskFormData = {
  tppi: "",
  category: "",
  task: "",
  output: "",
  code: "",
  link: "",
  collaborators: "",
  timeTaken: "",
  followUp: "neither",
};

export default function TaskModal({
  open,
  onClose,
  onSave,
  onDelete,
  onComplete,
  initialData,
  forceAddButtons,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: TaskFormData, saveMode: "active" | "draft") => void;
  onDelete?: () => void;
  onComplete?: () => void;
  initialData?: TaskFormData;
  forceAddButtons?: boolean;
}) {
  const [form, setForm] = useState<TaskFormData>(emptyForm);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [categories, setCategories] = useState(categoryOptions);
  const [error, setError] = useState("");

  const isEditing = !!initialData && !forceAddButtons;

  useEffect(() => {
    if (open) {
      setForm(initialData ?? emptyForm);
      setError("");
    }
  }, [open, initialData]);

  if (!open) return null;

  function update<K extends keyof TaskFormData>(key: K, value: TaskFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleAddCategory() {
    if (newCategory.trim()) {
      setCategories((prev) => [...prev, newCategory.trim()]);
      update("category", newCategory.trim());
      setNewCategory("");
      setAddingCategory(false);
    }
  }

  function handleSave() {
    if (!form.task.trim()) {
      setError("Task name is required before saving.");
      return;
    }
    setError("");
    onSave(form, "active");
    onClose();
  }

  function handleSaveDraft() {
    onSave(form, "draft");
    onClose();
  }

  function handleDelete() {
    onDelete?.();
    onClose();
  }

  function handleComplete() {
    onComplete?.();
    onClose();
  }

  const quadrants: { value: TaskFormData["followUp"]; label: string; classes: string }[] = [
    { value: "urgent_important", label: "Urgent + important", classes: "bg-red-50 text-red-700 border-red-200" },
    { value: "important", label: "Important, not urgent", classes: "bg-amber-50 text-amber-700 border-amber-200" },
    { value: "urgent", label: "Urgent, not important", classes: "bg-blue-50 text-blue-700 border-blue-200" },
    { value: "neither", label: "Neither", classes: "bg-gray-50 text-gray-600 border-gray-200" },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-5 max-h-[90vh] overflow-y-auto">
        <h2 className="text-base font-semibold mb-4">
          {isEditing ? "Edit task" : "Add task"}
        </h2>

        {/* Task info */}
        <p className="text-xs text-gray-500 mb-1">Task info</p>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <select
            value={form.tppi}
            onChange={(e) => update("tppi", e.target.value)}
            className="border border-gray-300 rounded-md px-2 py-2 text-sm"
          >
            <option value="">TPPI</option>
            {tppiOptions.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>

          <select
            value={form.category}
            onChange={(e) => update("category", e.target.value)}
            className="border border-gray-300 rounded-md px-2 py-2 text-sm"
          >
            <option value="">Category</option>
            {categories.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>

        <input
          type="text"
          placeholder="Task"
          value={form.task}
          onChange={(e) => update("task", e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mb-2"
        />
        <textarea
          placeholder="Output"
          value={form.output}
          onChange={(e) => update("output", e.target.value)}
          rows={2}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mb-4"
        />

        {/* Collaboration */}
        <p className="text-xs text-gray-500 mb-1">Collaboration</p>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <select
            value={form.code}
            onChange={(e) => update("code", e.target.value)}
            className="border border-gray-300 rounded-md px-2 py-2 text-sm"
          >
            <option value="">Code</option>
            {codeOptions.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>

          <div className="flex items-center border border-gray-300 rounded-md px-2">
            <FiExternalLink size={14} className="text-gray-400 mr-1" />
            <input
              type="text"
              placeholder="Link"
              value={form.link}
              onChange={(e) => update("link", e.target.value)}
              className="w-full py-2 text-sm outline-none"
            />
          </div>
        </div>

        <input
          type="text"
          placeholder="Collaborators (comma separated)"
          value={form.collaborators}
          onChange={(e) => update("collaborators", e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mb-2"
        />

        <div className="flex items-center gap-2 border border-gray-300 rounded-md px-3 py-2 mb-4">
          <FiClock size={14} className="text-gray-400" />
          <input
            type="number"
            min={0}
            max={23}
            placeholder="HH"
            value={form.timeTaken.split(":")[0] ?? ""}
            onChange={(e) => {
              const mins = form.timeTaken.split(":")[1] ?? "";
              update("timeTaken", `${e.target.value}:${mins}`);
            }}
            className="w-12 text-sm outline-none text-center"
          />
          <span className="text-gray-400">:</span>
          <input
            type="number"
            min={0}
            max={59}
            placeholder="MM"
            value={form.timeTaken.split(":")[1] ?? ""}
            onChange={(e) => {
              const hrs = form.timeTaken.split(":")[0] ?? "";
              update("timeTaken", `${hrs}:${e.target.value}`);
            }}
            className="w-12 text-sm outline-none text-center"
          />
          <span className="text-xs text-gray-400">hrs : mins</span>
        </div>

        {/* Follow up */}
        <div className="border border-gray-200 rounded-md p-3 mb-4">
          <p className="text-xs text-gray-600 mb-2">Follow up? — adds to tomorrow</p>
          <div className="grid grid-cols-2 gap-1.5 mb-2">
            {quadrants.map((q) => (
              <button
                key={q.value}
                type="button"
                onClick={() => update("followUp", q.value)}
                className={`text-xs text-center py-2 rounded-md border ${q.classes} ${
                  form.followUp === q.value ? "ring-2 ring-offset-1 ring-gray-400" : ""
                }`}
              >
                {q.label}
              </button>
            ))}
          </div>

          {addingCategory ? (
            <div className="flex gap-1">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="New category name"
                className="flex-1 border border-gray-300 rounded-md px-2 py-1 text-xs"
              />
              <button onClick={handleAddCategory} className="text-xs bg-green-700 text-white px-2 rounded-md">
                Add
              </button>
            </div>
          ) : (
            <button onClick={() => setAddingCategory(true)} className="text-xs text-blue-600 hover:underline">
              + Add new category
            </button>
          )}
        </div>

        {error && <p className="text-xs text-red-600 mb-2">{error}</p>}

        {/* Actions — differ depending on add vs edit */}
        <div className="flex justify-end gap-2 flex-wrap">
          {isEditing ? (
            <>
              <button onClick={handleDelete} className="text-sm px-3 py-1.5 border border-red-300 text-red-600 rounded-md hover:bg-red-50">
                Delete
              </button>
              <button onClick={handleComplete} className="text-sm px-3 py-1.5 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50">
                Complete
              </button>
              <button onClick={handleSave} className="text-sm px-3 py-1.5 bg-green-700 text-white rounded-md hover:bg-green-800">
                Save changes
              </button>
            </>
          ) : (
            <>
              <button onClick={onClose} className="text-sm px-3 py-1.5 border border-gray-300 rounded-md text-gray-600">
                Cancel
              </button>
              <button onClick={handleSaveDraft} className="text-sm px-3 py-1.5 border border-amber-300 text-amber-700 rounded-md hover:bg-amber-50">
                Save as draft
              </button>
              <button onClick={handleSave} className="text-sm px-3 py-1.5 bg-green-700 text-white rounded-md hover:bg-green-800">
                Add to list
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}