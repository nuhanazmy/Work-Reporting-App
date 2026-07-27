"use client";

import { useState } from "react";
import { FiUser, FiSun, FiMoon, FiMonitor, FiLogOut } from "react-icons/fi";

type Theme = "light" | "dark" | "system";

export default function AccountPage() {
  const [name, setName] = useState("Nuha Nazmy");
  const [email, setEmail] = useState("nuhanazmy562@example.com");
  const [password, setPassword] = useState("");
  const [theme, setTheme] = useState<Theme>("light");

  function handleSave() {
    // TODO: wire this up to Supabase (update profiles table + auth) later
    console.log("Saving profile:", { name, email, password, theme });
  }

  function handleLogout() {
    // TODO: wire this up to supabase.auth.signOut() later
    console.log("Logging out");
  }

  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md mx-auto bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-medium text-sm">
            {initials || <FiUser size={18} />}
          </div>
          <div>
            <h1 className="text-sm font-semibold">Account settings</h1>
            <p className="text-xs text-gray-500">Manage your profile</p>
          </div>
        </div>

        {/* Name */}
        <div className="mb-4">
          <label className="block text-xs text-gray-500 mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>

        {/* Email */}
        <div className="mb-4">
          <label className="block text-xs text-gray-500 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>

        {/* Password */}
        <div className="mb-5">
          <label className="block text-xs text-gray-500 mb-1">New password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Leave blank to keep current password"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 placeholder:text-gray-400"
          />
        </div>

        {/* Theme */}
        <div className="mb-6">
          <label className="block text-xs text-gray-500 mb-2">Theme</label>
          <div className="flex gap-2">
            {(
              [
                { value: "light", label: "Light", icon: <FiSun size={16} /> },
                { value: "dark", label: "Dark", icon: <FiMoon size={16} /> },
                { value: "system", label: "System", icon: <FiMonitor size={16} /> },
              ] as { value: Theme; label: string; icon: React.ReactNode }[]
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTheme(opt.value)}
                className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-md text-xs border ${
                  theme === opt.value
                    ? "bg-green-50 border-green-600 text-green-700"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 bg-green-700 text-white rounded-md py-2 text-sm font-medium hover:bg-green-800"
          >
            Save changes
          </button>
          <button
            onClick={handleLogout}
            className="flex-1 flex items-center justify-center gap-1 border border-red-300 text-red-600 rounded-md py-2 text-sm hover:bg-red-50"
          >
            <FiLogOut size={14} />
            Logout
          </button>
        </div>
      </div>
    </main>
  );
}