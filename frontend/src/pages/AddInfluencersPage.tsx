import { useState } from "react";
import { api } from "../api";

type Added = { id: number; handle: string; platform: string };

export default function AddInfluencersPage() {
  const [input, setInput] = useState("");
  const [added, setAdded] = useState<Added[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const parseHandles = (raw: string) => {
    // split by commas, whitespace, or newlines; trim; drop empties; strip leading '@'
    const parts = raw
      .split(/[,\s\n]+/)
      .map((h) => h.trim())
      .filter(Boolean)
      .map((h) => (h.startsWith("@") ? h.slice(1) : h).toLowerCase());
    // de-duplicate
    return Array.from(new Set(parts));
  };

  const add = async () => {
    setErr(null);
    const handles = parseHandles(input);
    if (!handles.length) return;

    const payload = handles.map((h) => ({ handle: h, platform: "instagram" }));

    try {
      setLoading(true);
      const { data } = await api.post<Added[]>("/influencers", payload);
      // append to previously added list
      setAdded((prev) => [...data, ...prev]);
      setInput("");
    } catch (e: any) {
      setErr(e?.response?.data?.detail || "Failed to add influencers");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      {/* Add form */}
      <div className="card">
        <div className="card-head flex items-center justify-between">
          <h2 className="text-lg font-semibold">Add Influencers</h2>
          <span className="text-xs text-slate-500">
            Tip: separate by comma, space, or newline
          </span>
        </div>

        <div className="card-body">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Handles
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={6}
            className="input min-h-40 resize-y"
            placeholder="@alice, bob
carol"
          />

          {err && (
            <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
              {err}
            </p>
          )}

          <div className="mt-4 flex gap-2">
            <button
              onClick={add}
              disabled={loading || !input.trim()}
              className="btn-primary disabled:opacity-60"
            >
              {loading ? "Adding…" : "Add"}
            </button>
            <button
              type="button"
              onClick={() => setInput("")}
              className="btn-outline"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Recently added */}
      {added.length > 0 && (
        <div className="card">
          <div className="card-head flex items-center justify-between">
            <h3 className="font-semibold">Recently Added</h3>
            <span className="text-xs text-slate-500">({added.length})</span>
          </div>

          <div className="card-body">
            <ul className="divide-y divide-[hsl(var(--border))]">
              {added.map((x) => (
                <li key={x.id} className="py-2 flex items-center justify-between">
                  <div className="text-sm">
                    <span className="font-medium">@{x.handle}</span>{" "}
                    <span className="text-slate-500">— {x.platform}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
