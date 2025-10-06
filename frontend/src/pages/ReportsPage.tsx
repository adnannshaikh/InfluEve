import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api";
import ScoreRadar from "../components/ScoreRadar";

type SortKey = "trust" | "auth" | "rel" | "res" | "roas";

interface Item {
  influencer_id: number;
  brief_id: number;
  handle: string;
  authenticity: number;
  relevance: number;
  resonance: number;
  expected_roas: number;
  trust_index: number;
  top_signals: string[];
}

export default function ReportsPage() {
  const { briefId } = useParams();
  const [rows, setRows] = useState<Item[]>([]);
  const [sortBy, setSortBy] = useState<SortKey>("trust");
  const [loading, setLoading] = useState<boolean>(true);
  const [err, setErr] = useState<string | null>(null);

  // fetch once per brief
  useEffect(() => {
    if (!briefId) return;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const { data } = await api.get<Item[]>(`/reports/${briefId}`);
        setRows(data || []);
      } catch (e: any) {
        setErr(e?.response?.data?.detail || "Failed to load report");
      } finally {
        setLoading(false);
      }
    })();
  }, [briefId]);

  // client-side sort
  const sorted = useMemo(() => {
    const sorters: Record<SortKey, (a: Item, b: Item) => number> = {
      trust: (a, b) => b.trust_index - a.trust_index,
      auth: (a, b) => b.authenticity - a.authenticity,
      rel: (a, b) => b.relevance - a.relevance,
      res: (a, b) => b.resonance - a.resonance,
      roas: (a, b) => b.expected_roas - a.expected_roas,
    };
    return [...rows].sort(sorters[sortBy]);
  }, [rows, sortBy]);

  if (!briefId) return <p className="p-6 text-sm text-red-600">Invalid brief.</p>;

  // ------- CSV helpers -------
  const csvHeader = [
    "handle",
    "authenticity",
    "relevance",
    "resonance",
    "expected_roas",
    "trust_index",
  ];

  const csvEscape = (v: unknown) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    // prettier-ignore
  };

  const toCSV = (items: Item[]) => {
    const header = csvHeader.join(",");
    const lines = items.map((r) =>
      [
        r.handle,
        r.authenticity.toFixed(1),
        r.relevance.toFixed(1),
        r.resonance.toFixed(1),
        r.expected_roas.toFixed(2),
        r.trust_index.toFixed(1),
      ]
        .map(csvEscape)
        .join(",")
    );
    return "\uFEFF" + [header, ...lines].join("\n"); // UTF-8 BOM for Excel
  };

  const downloadCSV = () => {
    if (!sorted.length) return alert("Nothing to export yet.");
    const blob = new Blob([toCSV(sorted)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `influencer_report_brief_${briefId}_${stamp}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  // ---------------------------

  return (
    <section className="space-y-6">
      {/* Header controls */}
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">Reports (Brief {briefId})</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={downloadCSV}
            disabled={!sorted.length}
            className="btn-outline disabled:opacity-60"
          >
            Export CSV
          </button>

          <label htmlFor="sortBy" className="flex items-center gap-2 text-sm">
            <span className="text-slate-600">Sort by</span>
            <select
              id="sortBy"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="input w-[160px]"
            >
              <option value="trust">Trust</option>
              <option value="auth">Authenticity</option>
              <option value="rel">Relevance</option>
              <option value="res">Resonance</option>
              <option value="roas">ROAS</option>
            </select>
          </label>
        </div>
      </div>

      {/* Content states */}
      {loading ? (
        <div className="card">
          <div className="card-body">
            <p className="text-sm text-slate-500">Loading…</p>
          </div>
        </div>
      ) : err ? (
        <div className="card border-red-200">
          <div className="card-body">
            <p className="text-sm text-red-600">{err}</p>
          </div>
        </div>
      ) : !sorted.length ? (
        <div className="card">
          <div className="card-body">
            <p className="text-sm text-slate-500">No data.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Table + Radar grid */}
          <div className="grid lg:grid-cols-3 gap-4">
            {/* Table */}
            <div className="card lg:col-span-2 overflow-hidden">
              <div className="card-head">
                <h3 className="font-semibold">Shortlisted Creators</h3>
              </div>
              <div className="card-body overflow-x-auto p-0">
                <table className="w-full border-separate border-spacing-0">
                  <thead className="text-xs uppercase text-slate-500">
                    <tr>
                      <th className="text-left px-3 py-2 border-b border-[hsl(var(--border))]">
                        Influencer
                      </th>
                      <th className="text-right px-3 py-2 border-b border-[hsl(var(--border))]">
                        Authenticity
                      </th>
                      <th className="text-right px-3 py-2 border-b border-[hsl(var(--border))]">
                        Relevance
                      </th>
                      <th className="text-right px-3 py-2 border-b border-[hsl(var(--border))]">
                        Resonance
                      </th>
                      <th className="text-right px-3 py-2 border-b border-[hsl(var(--border))]">
                        ROAS
                      </th>
                      <th className="text-right px-3 py-2 border-b border-[hsl(var(--border))]">
                        Trust
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((r) => (
                      <tr key={r.influencer_id} className="hover:bg-[hsl(var(--soft))]/60">
                        <td className="px-3 py-2">@{r.handle}</td>
                        <td className="px-3 py-2 text-right">{r.authenticity.toFixed(1)}</td>
                        <td className="px-3 py-2 text-right">{r.relevance.toFixed(1)}</td>
                        <td className="px-3 py-2 text-right">{r.resonance.toFixed(1)}</td>
                        <td className="px-3 py-2 text-right">×{r.expected_roas.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right">{r.trust_index.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Radar */}
            <div className="card">
              <div className="card-head">
                <h3 className="font-semibold">Radar (Top influencer)</h3>
              </div>
              <div className="card-body">
                <ScoreRadar
                  row={{
                    authenticity: sorted[0].authenticity,
                    relevance: sorted[0].relevance,
                    resonance: sorted[0].resonance,
                    expected_roas: sorted[0].expected_roas,
                    trust_index: sorted[0].trust_index,
                  }}
                  size={280}
                />

                {sorted[0].top_signals?.length > 0 && (
                  <ul className="mt-3 list-disc list-inside text-sm text-slate-600">
                    {sorted[0].top_signals.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
