"use client";

import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  function handleClear() {
    setIdentifier("");
    setPassword("");
  }

  function handleLogin() {
    console.log("Login attempt:", { identifier, password });
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <Link href="/" className="text-sm text-blue-600 hover:underline mb-4 inline-block">
          ← Back to home
        </Link>

        <h1 className="text-lg font-semibold mb-6">Login</h1>

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
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>

        <div className="flex gap-2">
          <button onClick={handleClear} className="flex-1 border border-gray-300 rounded-md py-2 text-sm text-gray-700 hover:bg-gray-50">
            Clear
          </button>
          <button onClick={handleLogin} className="flex-1 bg-green-700 text-white rounded-md py-2 text-sm font-medium hover:bg-green-800">
            Login
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