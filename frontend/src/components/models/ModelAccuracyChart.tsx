import { BarChart3 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { modelPerformances } from "@/data/model-data";

const chartData = modelPerformances.map((model) => ({
  ...model,
  shortName: model.name.length > 14 ? model.name.replace("EfficientNet", "EffNet") : model.name,
}));

const topAccuracy = chartData[0]?.accuracy ?? 0;

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: (typeof chartData)[number] }>;
}) {
  if (!active || !payload?.length) return null;
  const model = payload[0].payload;
  const isSelected = model.status === "Selected Model";

  return (
    <div className="glass-card rounded-2xl px-5 py-4 shadow-[0_16px_48px_rgb(15_38_83_/0.14)]">
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${isSelected ? "bg-primary shadow-[0_0_8px_rgb(11_124_255_/0.5)]" : "bg-blue-200"}`} />
        <p className="text-sm font-black">{model.name}</p>
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">{model.category}</p>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-2xl font-black text-primary">{model.accuracy.toFixed(2)}</span>
        <span className="text-sm font-bold text-muted-foreground">%</span>
      </div>
      {isSelected && (
        <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
          Best Model
        </span>
      )}
    </div>
  );
}

export function ModelAccuracyChart() {
  return (
    <Card className="glass-card-strong relative h-full overflow-hidden rounded-[28px] border-blue-100/80 bg-white/92 animate-fade-in-up stagger-2">
      <div className="absolute inset-0 neural-grid opacity-[0.06]" />
      <CardHeader className="relative flex-row items-start justify-between gap-4 pb-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary/10 to-indigo-100/80 text-primary shadow-sm ring-1 ring-primary/10">
            <BarChart3 className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <CardTitle className="text-xl font-black tracking-tight">Accuracy Comparison</CardTitle>
            <p className="mt-1 text-xs font-medium leading-5 text-muted-foreground">Test accuracy across all evaluated model architectures</p>
          </div>
        </div>
        {/* Top accuracy highlight badge */}
        <div className="shrink-0 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 px-4 py-2 ring-1 ring-emerald-200/70 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Top</span>
          <strong className="ml-1 text-sm font-black text-emerald-700">{topAccuracy.toFixed(1)}%</strong>
        </div>
      </CardHeader>
      <CardContent className="relative pt-0">
        <div className="h-[392px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 34, right: 8, left: 0, bottom: 10 }} barCategoryGap="20%">
              <defs>
                <linearGradient id="selectedBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="40%" stopColor="#0b7cff" />
                  <stop offset="100%" stopColor="#0b7cff" />
                </linearGradient>
                <linearGradient id="evaluatedBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#c7deff" />
                  <stop offset="100%" stopColor="#dbeafe" />
                </linearGradient>
                <filter id="barGlow">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feFlood floodColor="#0b7cff" floodOpacity="0.3" />
                  <feComposite in2="blur" operator="in" />
                  <feMerge>
                    <feMergeNode />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <CartesianGrid strokeDasharray="0" stroke="#e0eaf8" strokeOpacity={0.9} vertical={false} />
              <XAxis
                dataKey="shortName"
                tick={{ fontSize: 10, fill: "#243b63", fontWeight: 800 }}
                interval={0}
                angle={0}
                height={52}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[50, 100]}
                width={38}
                tick={{ fontSize: 10, fill: "#64748b", fontWeight: 700 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(11,124,255,0.04)", radius: 8 }} />
              <Bar dataKey="accuracy" radius={[14, 14, 2, 2]} maxBarSize={54}>
                {chartData.map((model) => {
                  const isSelected = model.name === "Improved CNN";
                  return (
                    <Cell
                      key={model.name}
                      fill={isSelected ? "url(#selectedBarGrad)" : "url(#evaluatedBarGrad)"}
                      stroke={isSelected ? "#6366f1" : "transparent"}
                      strokeWidth={isSelected ? 1.5 : 0}
                      filter={isSelected ? "url(#barGlow)" : undefined}
                    />
                  );
                })}
                <LabelList
                  dataKey="accuracy"
                  position="top"
                  formatter={(value: any) => `${Number(value).toFixed(1)}%`}
                  className="fill-foreground text-[10px] font-bold"
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
