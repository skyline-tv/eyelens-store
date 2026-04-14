import { useNavigate } from "react-router-dom";
import { logout, getAuth } from "../auth/auth";

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const auth = getAuth();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm text-zinc-400">Admin</div>
            <h1 className="text-2xl font-extrabold tracking-tight">Dashboard</h1>
            {auth?.username && <div className="mt-2 text-sm text-zinc-300">Signed in as {auth.username}</div>}
          </div>

          <button
            className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-semibold hover:bg-zinc-800"
            onClick={() => {
              logout();
              navigate("/login", { replace: true });
            }}
          >
            Logout
          </button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="text-sm font-semibold text-zinc-200">Quick status</div>
            <div className="mt-2 text-sm text-zinc-400">This is a placeholder admin dashboard page.</div>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="text-sm font-semibold text-zinc-200">Next steps</div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-400">
              <li>Add real API-backed admin modules</li>
              <li>Replace hardcoded credentials with a proper auth service</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

