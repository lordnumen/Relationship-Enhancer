import Link from "next/link";

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50 flex flex-col items-center p-8">
      <h2 className="text-3xl font-bold mb-6 text-pink-700">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mb-8">
        <div className="rounded-xl bg-white shadow p-6 border border-pink-200 text-center">
          <div className="text-lg font-semibold text-pink-600 mb-2">Mood Scores</div>
          <div className="text-2xl font-bold">8.5</div>
        </div>
        <div className="rounded-xl bg-white shadow p-6 border border-red-200 text-center">
          <div className="text-lg font-semibold text-red-600 mb-2">Love Levels</div>
          <div className="text-2xl font-bold">9.2</div>
        </div>
        <div className="rounded-xl bg-white shadow p-6 border border-blue-200 text-center">
          <div className="text-lg font-semibold text-blue-600 mb-2">Recent Entries</div>
          <div className="text-md">See Tracker</div>
        </div>
      </div>
      <div className="flex flex-wrap gap-4 justify-center">
        <Link href="/tracker" className="px-6 py-3 rounded-lg bg-blue-200 hover:bg-blue-300 text-blue-900 font-semibold">Tracker</Link>
        <Link href="/love-enhancer" className="px-6 py-3 rounded-lg bg-red-200 hover:bg-red-300 text-red-900 font-semibold">Love Enhancer</Link>
        <Link href="/health-fitness" className="px-6 py-3 rounded-lg bg-green-200 hover:bg-green-300 text-green-900 font-semibold">Health & Fitness</Link>
        <Link href="/auth" className="px-6 py-3 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold">Login / Signup</Link>
      </div>
    </main>
  );
} 