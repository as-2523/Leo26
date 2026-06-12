import Dashboard from "../components/Dashboard";

export default function Home() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          🏏 India Cricket Schedule
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Upcoming fixtures for India Men, India A Men, India Under-19 Men, India Women and
          India A Women — next 3 months, all times in IST.
        </p>
      </header>
      <Dashboard />
    </main>
  );
}
