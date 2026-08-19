"use client";

import Link from "next/link";
import { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  function handleClear() {
    setIdentifier("");
    setPassword("");
    setError("");
  }

  async function handleLogin() {
    setError("");
    setLoading(true);

    let loginEmail = identifier;

    // if it's not an email, treat it as a username and resolve it first
    if (!identifier.includes("@")) {
      const { data: resolvedEmail, error: lookupError } = await supabase.rpc(
        "get_email_by_username",
        { uname: identifier }
      );
      if (lookupError || !resolvedEmail) {
        setError("No account found with that username.");
        setLoading(false);
        return;
      }
      loginEmail = resolvedEmail;
    }

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    });

    if (loginError) {
      setError(loginError.message);
      setLoading(false);
      return;
    }

    router.push("/day");
    console.log("Login attempt:", { identifier, password });
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <Link href="/" className="text-sm text-blue-600 hover:underline mb-4 inline-block">
          ← Back to home
        </Link>

        <h1 className="text-lg font-semibold mb-6 text-gray-900">Login</h1>

        <div className="mb-4">
          <label className="block text-xs text-gray-500 mb-1">Email or username</label>
          <input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>

        <div className="mb-6">
          <label className="block text-xs text-gray-500 mb-1">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
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

        {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

        <div className="flex gap-2">
          <button
            onClick={handleClear}
            disabled={loading}
            className="flex-1 border border-gray-300 rounded-md py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Clear
          </button>
          <button
            onClick={handleLogin}
            disabled={loading}
            className="flex-1 bg-green-700 text-white rounded-md py-2 text-sm font-medium hover:bg-green-800 disabled:opacity-50"
          >
            {loading ? "Logging in…" : "Login"}
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-4 text-center">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-blue-600 hover:underline">Sign up</Link>
        </p>
      </div>
    </main>
  );
}