import { useState, useEffect, useMemo } from "react";
import { api } from "../api";
import { useNavigate } from "react-router-dom";

interface Brief {
  id: number;
  brand: string;
  keywords: string[];
  kpi_weights: Record<string, number>;
}

export default function BriefPage() {
  const [brand, setBrand] = useState("");
  const [keywords, setKeywords] = useState("");
  const [weights, setWeights] = useState({
    authenticity: 0.25,
    relevance: 0.25,
    resonance: 0.25,
    return: 0.25, // used by backend as expected_roas weight
  });

  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const nav = useNavigate();

  const number = (val: string) => Math.max(0, Math.min(1, Number(val) || 0));
  const weightSum = useMemo(
    () => Object.values(weights).reduce((a, b) => a + (Number(b) || 0), 0),
    [weights]
  );

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const { data } = await api.get<Brief[]>("/brief");
        setBriefs(data);
      } catch (e: any) {
        setErr(e?.response?.data?.detail || "Failed to load briefs");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async () => {
    const cleanedBrand = brand.trim();
    if (!cleanedBrand) return;

    const payload = {
      brand: cleanedBrand,
      keywords: keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean),
      kpi_weights: weights,
    };

    try {
      setSaving(true);
      setErr(null);
      const { data } = await api.post<Brief>("/brief", payload);

      setBriefs((prev) => [{ ...data }, ...prev]);

      setBrand("");
      setKeywords("");
      setWeights({
        authenticity: 0.25,
        relevance: 0.25,
        resonance: 0.25,
        return: 0.25,
      });

      nav(`/reports/${data.id}`);
    } catch (e: any) {
      setErr(e?.response?.data?.detail || "Failed to create brief");
    } finally {
      setSaving(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      save();
    }
  };

  return (
    <section className="space-y-6" onKeyDown={onKeyDown}>
      {/* Create Brief */}
      <div className="card max-w-2xl">
        <div className="card-head flex items-center justify-between">
          <h2 className="text-lg font-semibold">Create Brief</h2>
          <span className="text-xs text-slate-500">
            Press <kbd className="px-1.5 py-0.5 rounded border">Ctrl/⌘ + Enter</kbd> to save
          </span>
        </div>

        <div className="card-body space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Brand</label>
            <input
              className="input"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="Brand name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Keywords (comma separated)
            </label>
            <input
              className="input"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="skincare, serum"
            />
          </div>

          <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
            <div className="px-4 py-3 border-b border-[hsl(var(--border))]">
              <span className="font-medium">KPI Weights (0–1)</span>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(weights).map(([k, v]) => (
                  <label key={k} className="flex items-center gap-3">
                    <span className="w-32 shrink-0 capitalize text-sm text-slate-600">{k}</span>
                    <input
                      className="input"
                      type="number"
                      step="0.05"
                      value={v}
                      min={0}
                      max={1}
                      onChange={(e) =>
                        setWeights({
                          ...weights,
                          [k]: number(e.target.value),
                        })
                      }
                    />
                  </label>
                ))}
              </div>

              <p className="text-xs text-slate-500">
                Sum doesn’t need to be 1; normalization happens server-side. Current sum:{" "}
                <strong>{weightSum.toFixed(2)}</strong>
              </p>
            </div>
          </div>

          {err && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
              {err}
            </p>
          )}

          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={!brand.trim() || saving}
              className="btn-primary disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save & View Reports"}
            </button>
            <button
              type="button"
              onClick={() => {
                setBrand("");
                setKeywords("");
                setWeights({
                  authenticity: 0.25,
                  relevance: 0.25,
                  resonance: 0.25,
                  return: 0.25,
                });
              }}
              className="btn-outline"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Existing Briefs */}
      <div className="card">
        <div className="card-head flex items-center justify-between">
          <h2 className="text-lg font-semibold">Existing Briefs</h2>
        </div>

        <div className="card-body">
          {loading ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : err ? (
            <p className="text-sm text-red-600">{err}</p>
          ) : briefs.length === 0 ? (
            <p className="text-sm text-slate-500">No briefs found yet.</p>
          ) : (
            <ul className="divide-y divide-[hsl(var(--border))]">
              {briefs.map((b) => (
                <li key={b.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{b.brand}</div>
                    <div className="text-xs text-slate-500">
                      {b.keywords.join(", ") || <span className="italic">no keywords</span>}
                    </div>
                  </div>
                  <button
                    className="btn-outline"
                    onClick={() => nav(`/reports/${b.id}`)}
                  >
                    View Report
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
