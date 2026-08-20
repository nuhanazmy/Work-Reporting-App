"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FiUser, FiSun, FiMoon, FiMonitor, FiLogOut, FiEye, FiEyeOff, FiCamera } from "react-icons/fi";
import { FONT_SCALE_STEPS, getFontScale, setFontScale } from "@/lib/fontScale";
import { getStoredTheme, setTheme as applyAndStoreTheme, Theme } from "@/lib/theme";
import { createClient } from "@/lib/supabase/client";

export default function AccountPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [theme, setThemeState] = useState<Theme>("system");
  const [fontScale, setFontScaleState] = useState(1);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const router = useRouter();
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    setFontScaleState(getFontScale());
    setThemeState(getStoredTheme());

    async function loadProfile() {
      setLoading(true);
      setError("");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);
      setEmail(user.email ?? "");

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("name, theme")
        .eq("id", user.id)
        .single();

      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }

      if (profile) {
        setName(profile.name ?? "");
        if (profile.theme) {
          setThemeState(profile.theme as Theme);
        }
      }

      setLoading(false);
    }

    loadProfile();
  }, [supabase, router]);

  function handleThemeChange(value: Theme) {
    setThemeState(value);
    applyAndStoreTheme(value);
  }

  function handleFontScaleChange(index: number) {
    const scale = FONT_SCALE_STEPS[index];
    setFontScale(scale);
    setFontScaleState(scale);
  }

  function handleAvatarPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // TODO(backend): upload to Supabase Storage (a bucket like "avatars"),
    // then save the returned public URL to profiles.avatar_url.
    // This preview is local-only for now — it won't persist after refresh.
    const localUrl = URL.createObjectURL(file);
    setAvatarUrl(localUrl);
  }

  async function handleSave() {
    if (!userId) return;
    setSaving(true);
    setError("");
    setSuccessMsg("");

    // Update name + theme in the profiles table
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ name, theme })
      .eq("id", userId);

    if (profileError) {
      setError(profileError.message);
      setSaving(false);
      return;
    }

    // Update email if it changed
    const { data: { user } } = await supabase.auth.getUser();
    if (email && email !== user?.email) {
      const { error: emailError } = await supabase.auth.updateUser({ email });
      if (emailError) {
        setError(emailError.message);
        setSaving(false);
        return;
      }
    }

    // Update password only if the field was filled in
    if (password.trim()) {
      const { error: passwordError } = await supabase.auth.updateUser({ password });
      if (passwordError) {
        setError(passwordError.message);
        setSaving(false);
        return;
      }
      setPassword("");
    }

    setSaving(false);
    setSuccessMsg("Changes saved.");
    setTimeout(() => setSuccessMsg(""), 3000);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-10">
        <p className="text-sm text-gray-400 max-w-2xl mx-auto">Loading account…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-10">
      <div className="w-full max-w-2xl mx-auto">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1">Account settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Manage your profile, security, and preferences</p>

        {error && <p className="text-xs text-red-600 mb-4">{error}</p>}
        {successMsg && <p className="text-xs text-green-700 mb-4">{successMsg}</p>}

        {/* ---------------- Profile section ---------------- */}
        <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4">Profile</h2>

          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="w-16 h-16 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-medium text-lg">
                  {initials || <FiUser size={22} />}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center hover:bg-gray-700"
                aria-label="Change profile photo"
              >
                <FiCamera size={12} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarPick}
                className="hidden"
              />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{name || "Your name"}</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Change photo
              </button>
            </div>
          </div>

          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </section>

        {/* ---------------- Security section ---------------- */}
        <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4">Security</h2>

          <div className="mb-4">
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">New password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank to keep current password"
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-md px-3 py-2 pr-10 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-600 placeholder:text-gray-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          </div>
        </section>

        {/* ---------------- Appearance section ---------------- */}
        <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4">Appearance</h2>

          <div className="mb-6">
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-2">Theme</label>
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
                  onClick={() => handleThemeChange(opt.value)}
                  className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-md text-xs border ${
                    theme === opt.value
                      ? "bg-green-50 dark:bg-green-900/30 border-green-600 text-green-700 dark:text-green-400"
                      : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-2">Text size</label>
            <div className="flex items-center gap-3 border border-gray-200 dark:border-gray-600 rounded-md px-4 py-3">
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
        </section>

        {/* ---------------- Actions ---------------- */}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-green-700 text-white rounded-md py-2.5 text-sm font-medium hover:bg-green-800 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
          <button
            onClick={handleLogout}
            className="flex-1 flex items-center justify-center gap-1 border border-red-300 text-red-600 rounded-md py-2.5 text-sm hover:bg-red-50 dark:hover:bg-red-950"
          >
            <FiLogOut size={14} />
            Logout
          </button>
        </div>
      </div>
    </main>
  );
}