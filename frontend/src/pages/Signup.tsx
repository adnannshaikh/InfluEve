import { useState } from "react";
import { api } from "../api";
import { useNavigate, Link } from "react-router-dom";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const nav = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      const { data } = await api.post("/auth/signup", null, {
        params: { email, password },
      });
      localStorage.setItem("token", data.access_token);
      nav("/");
    } catch (e: any) {
      setErr(e?.response?.data?.detail || "Signup failed");
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-bg">
      {/* top-right auth links */}
      <nav className="fixed top-4 right-6 text-sm text-slate-600">
        <Link to="/login" className="hover:text-brand">
          Login
        </Link>
        <span className="mx-2 text-slate-400">/</span>
        <Link to="/signup" className="hover:text-brand">
          Signup
        </Link>
      </nav>

      {/* centered title slightly above the card */}
      <div className="w-full max-w-sm">
        <h1 className="text-center text-2xl font-semibold text-text -mt-16 mb-4">
          Influencer Eval MVP
        </h1>

        <div className="card">
          <div className="card-head text-center">
            <h2 className="text-xl font-semibold text-text">Create Account</h2>
            <p className="text-sm text-slate-500 mt-1">
              Join Influeve and start your journey
            </p>
          </div>

          <form onSubmit={submit} className="card-body space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Email
              </label>
              <input
                className="input"
                type="email"
                placeholder="you@brand.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Password
              </label>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {err && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
                {err}
              </p>
            )}

            <button type="submit" className="btn-primary w-full mt-2">
              Create Account
            </button>

            <p className="text-center text-sm text-slate-500 mt-3">
              Have an account?{" "}
              <Link to="/login" className="text-brand hover:underline">
                Login
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
