import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <span className="font-semibold text-gray-800">Weekly Reporting</span>
        <div className="flex gap-2">
          <Link
            href="/login"
            className="px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 text-sm bg-green-700 text-white rounded-md hover:bg-green-800"
          >
            Sign up
          </Link>
        </div>
      </header>

      {/* Hero section */}
      <section className="text-center px-4 py-16">
        <h1 className="text-2xl font-semibold text-gray-900 mb-3">
          One place for your daily work and weekly reports
        </h1>
        <p className="text-sm text-gray-600 max-w-md mx-auto mb-6">
          Turns daily logs into a ready weekly report — no manual formatting,
          no retyping at the end of the week.
        </p>
        <div className="flex justify-center gap-3">
          <Link
            href="/signup"
            className="px-5 py-2.5 bg-green-700 text-white rounded-md text-sm font-medium hover:bg-green-800"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="px-5 py-2.5 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
          >
            Login
          </Link>
        </div>
      </section>

      {/* Feature strip */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto px-6 pb-16">
        <div className="border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
          Log daily tasks in seconds
        </div>
        <div className="border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
          Auto-build the weekly report
        </div>
        <div className="border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
          Preview, download, submit
        </div>
      </section>
    </main>
  );
}