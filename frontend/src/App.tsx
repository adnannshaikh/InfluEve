import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";

export default function App() {
  const nav = useNavigate();
  const { pathname } = useLocation();

  const token = localStorage.getItem("token");
  const isLoggedIn = !!token;

  const isAuthRoute = pathname === "/login" || pathname === "/signup";

  const handleLogout = () => {
    localStorage.removeItem("token");
    nav("/login");
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--bg))] text-[hsl(var(--text))]">
      {/* Header is hidden on auth pages so they can show their own Login/Signup */}
      {!isAuthRoute && isLoggedIn && (
        <header className="border-b border-[hsl(var(--border))] bg-[hsl(var(--soft))]">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
            <h1 className="text-base sm:text-lg font-semibold">Influencer Eval MVP</h1>
            <nav className="flex items-center gap-3 text-sm text-slate-600">
              <Link to="/" className="hover:text-[hsl(var(--brand))]">
                Briefs
              </Link>
              <Link to="/add" className="hover:text-[hsl(var(--brand))]">
                Add Influencers
              </Link>
              <button
                onClick={handleLogout}
                className="inline-flex items-center rounded-lg border border-[hsl(var(--border))] px-3 py-1.5 hover:bg-[hsl(var(--soft))]"
              >
                Logout
              </button>
            </nav>
          </div>
        </header>
      )}

      {/* Page content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
