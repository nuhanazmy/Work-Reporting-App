"use client";

import { useState, useEffect } from "react";
import { FiUser, FiSun, FiMoon, FiMonitor, FiLogOut } from "react-icons/fi";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { FONT_SCALE_STEPS, getFontScale, setFontScale } from "@/lib/fontScale";

type Theme = "light" | "dark" | "system";

export default function AccountPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [theme, setTheme] = useState<Theme>("light");
  const [error, setError] = useState("");
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [fontScale, setFontScaleState] = useState(1);

  useEffect(() => {
    setFontScaleState(getFontScale());
  }, []);

  function handleFontScaleChange(index: number) {
    const scale = FONT_SCALE_STEPS[index];
    setFontScale(scale);
    setFontScaleState(scale);
  }

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      const { data: profile, error: loadError } = await supabase
        .from("profiles")
        .select("name, email, theme")
        .eq("id", user.id)
        .single();

      if (loadError) {
        setError(loadError.message);
        return;
      }

      if (profile) {
        setName(profile.name ?? "");
        setEmail(profile.email ?? "");
        setTheme(profile.theme ?? "light");
      }
    }
    loadProfile();
  }, []);
  // TODO(backend): this currently only updates local React state.
  // Needs to also:
  // - INSERT a new row into `daily_tasks` when adding (not editing)
  // - UPDATE the matching row when editing
  // - map `data.followUp` to the `importance`/`urgency` columns (1-5 scale) and set is_follow_up
  // - the Postgres trigger `handle_follow_up_task` (see schema.sql) auto-creates tomorrow's
  //   task server-side once is_follow_up is set true — so the client-side "copy into followUps"
  //   logic below can likely be REMOVED once this is wired up, to avoid duplicating that task
  async function handleSave() {
    setError("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ name, theme })
      .eq("id", user.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    if (password) {
      const { error: pwError } = await supabase.auth.updateUser({ password });
      if (pwError) {
        setError(pwError.message);
        return;
      }
      setPassword(""); // clear it so a second Save click doesn't resend the old password
    }

    if (email) {
      const { error: emailError } = await supabase.auth.updateUser({ email });
      if (emailError) {
        setError(emailError.message);
        return;
      }
    }
    console.log("Saving profile:", { name, email, password, theme });
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
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
                className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-md text-xs border ${theme === opt.value
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

        {/* Font-scale */}
        <div className="mb-6">
          <label className="block text-xs text-gray-500 mb-2">Text size</label>
          <div className="flex items-center gap-3 border border-gray-200 rounded-md px-4 py-3">
            <span className="text-xs text-gray-400">A</span>
            <input
              type="range"
              min={0}
              max={FONT_SCALE_STEPS.length - 1}
              step={1}
              value={FONT_SCALE_STEPS.indexOf(fontScale)}
              onChange={(e) => handleFontScaleChange(Number(e.target.value))}
              className="flex-1 accent-green-700"
            />
            <span className="text-lg text-gray-400">A</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">Applies across the whole app</p>
        </div>

        {/* Error message */}
        {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

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