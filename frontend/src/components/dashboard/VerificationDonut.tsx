import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { semanticColors } from "@/lib/constants";
import type { PredictionStatus } from "@/types/domain";

interface VerificationDonutProps {
  data: Array<{ name: PredictionStatus; value: number }>;
  compact?: boolean;
}

export function VerificationDonut({ data, compact = false }: VerificationDonutProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const chartData = total ? data : data.map((item) => ({ ...item, value: item.name === "Real" ? 1 : 0 }));
  const chartSize = compact ? "h-[185px]" : "h-[310px]";
  const innerRadius = compact ? 46 : 82;
  const outerRadius = compact ? 78 : 132;
  const centerSize = compact ? "h-20 w-20" : "h-28 w-28";

  return (
    <div className={compact ? "grid items-center" : "grid items-center gap-6 md:grid-cols-[1fr_240px]"}>
      <div className={`relative ${chartSize}`}>
        <div className="blue-grid absolute inset-0 opacity-35" />
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={chartData} innerRadius={innerRadius} outerRadius={outerRadius} paddingAngle={3} dataKey="value" stroke="white" strokeWidth={3}>
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={total ? semanticColors[entry.name] : "#dbe7f4"} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div className={`grid ${centerSize} place-items-center rounded-full bg-white/92 shadow-[0_12px_38px_rgb(15_38_83_/0.10)]`}>
            <div>
              <strong className={`${compact ? "text-2xl" : "text-3xl"} block font-black`}>{total}</strong>
              <span className="text-xs text-muted-foreground">Total Scans</span>
            </div>
          </div>
        </div>
      </div>
      {!compact && <div className="flex flex-col justify-center gap-5">
        {data.map((item) => (
          <div key={item.name} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-3 text-sm">
              <span className="h-3.5 w-3.5 rounded-full" style={{ background: semanticColors[item.name] }} />
              <span>{item.name === "Real" ? "Real Medicines" : item.name === "Fake" ? "Fake Detections" : "Suspicious Cases"}</span>
            </span>
            <strong className="text-lg">{item.value} <span className="text-sm font-semibold text-muted-foreground">({total ? ((item.value / total) * 100).toFixed(1) : "0.0"}%)</span></strong>
          </div>
        ))}
      </div>}
    </div>
  );
}
