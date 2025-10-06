import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  PolarRadiusAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Scores3 = { authenticity: number; relevance: number; resonance: number };
type Scores5 = Scores3 & { expected_roas?: number; trust_index?: number };

interface Props {
  /** Legacy shape (3 metrics) */
  scores?: Scores3;
  /** New shape (3 + optional 2 metrics) */
  row?: Scores5;
  size?: number;
}

export default function ScoreRadar({ scores, row, size = 320 }: Props) {
  // Base 3 metrics from either source
  const authenticity = row?.authenticity ?? scores?.authenticity ?? 0;
  const relevance = row?.relevance ?? scores?.relevance ?? 0;
  const resonance = row?.resonance ?? scores?.resonance ?? 0;

  // Optional extras only exist on `row`
  const expected_roas = row?.expected_roas;
  const trust_index = row?.trust_index;

  const data: { metric: string; value: number }[] = [
    { metric: "Authenticity", value: authenticity },
    { metric: "Relevance", value: relevance },
    { metric: "Resonance", value: resonance },
  ];

  if (typeof expected_roas === "number")
    data.push({ metric: "ROAS", value: expected_roas });
  if (typeof trust_index === "number")
    data.push({ metric: "Trust", value: trust_index });

  return (
    <div
      className="mx-auto flex items-center justify-center rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-soft p-4"
      style={{ width: size, height: size }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis
            dataKey="metric"
            tick={{ fill: "hsl(var(--text))", fontSize: 12 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fill: "hsl(var(--text))", fontSize: 10 }}
          />
          <Radar
            name="Score"
            dataKey="value"
            fill="hsl(var(--brand))"
            stroke="hsl(var(--brand))"
            fillOpacity={0.4}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "0.5rem",
              fontSize: "0.8rem",
            }}
            cursor={{ stroke: "hsl(var(--brand))", strokeDasharray: "3 3" }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
