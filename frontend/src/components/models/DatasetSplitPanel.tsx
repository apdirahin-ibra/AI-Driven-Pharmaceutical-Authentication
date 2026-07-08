import { Database, FlaskConical, Layers, Sparkles, TestTube2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { modelFacts } from "@/lib/constants";
import { formatNumber } from "@/lib/utils";

const splits = [
  {
    key: "training",
    label: "Training",
    value: modelFacts.dataset.training,
    gradient: "from-primary to-indigo-500",
    bgLight: "from-blue-50 to-indigo-50/50",
    ringColor: "ring-blue-100/60",
    icon: FlaskConical,
    glowColor: "hover:shadow-[0_0_20px_rgb(11_124_255_/0.12)]",
  },
  {
    key: "validation",
    label: "Validation",
    value: modelFacts.dataset.validation,
    gradient: "from-sky-400 to-cyan-500",
    bgLight: "from-sky-50 to-cyan-50/50",
    ringColor: "ring-sky-100/60",
    icon: Layers,
    glowColor: "hover:shadow-[0_0_20px_rgb(56_189_248_/0.12)]",
  },
  {
    key: "testing",
    label: "Testing",
    value: modelFacts.dataset.testing,
    gradient: "from-emerald-500 to-green-500",
    bgLight: "from-emerald-50 to-green-50/50",
    ringColor: "ring-emerald-100/60",
    icon: TestTube2,
    glowColor: "hover:shadow-[0_0_20px_rgb(34_197_94_/0.12)]",
  },
] as const;

export function DatasetSplitPanel() {
  const { total } = modelFacts.dataset;

  return (
    <Card className="glass-card-strong relative overflow-hidden rounded-3xl border-blue-100/80 animate-fade-in-up stagger-4">
      <div className="absolute inset-0 neural-grid opacity-10" />
      <CardHeader className="relative pb-3">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-primary/10 to-indigo-100/80 text-primary shadow-sm ring-1 ring-primary/10">
            <Database className="h-5 w-5" />
          </span>
          <div>
            <CardTitle className="text-xl tracking-tight">Dataset Summary</CardTitle>
            <p className="mt-1 text-xs font-medium leading-5 text-muted-foreground">Pharmaceutical image splits used for training & evaluation</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative space-y-4">
        {/* Total images card */}
        <div className="relative overflow-hidden rounded-2xl border border-blue-100/70 bg-gradient-to-br from-[#fbfdff] via-white to-[#f1f7ff] p-6 shadow-[0_14px_34px_rgb(15_38_83_/0.06)]">
          <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-[radial-gradient(circle,rgb(11_124_255_/0.08),transparent_70%)]" />
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Total Images</p>
              </div>
              <strong className="mt-2 block text-4xl font-black gradient-text">{formatNumber(total)}</strong>
            </div>
            <span className="glow-blue grid h-14 w-14 place-items-center rounded-2xl bg-white text-primary ring-1 ring-blue-100/80 animate-float">
              <Database className="h-7 w-7" />
            </span>
          </div>

          {/* Animated split bar */}
          <div className="mt-5 flex h-4 overflow-hidden rounded-full bg-slate-100/80 shadow-inner ring-1 ring-white">
            {splits.map((split) => (
              <div
                key={split.key}
                className={`animate-progress-fill bg-gradient-to-r ${split.gradient} first:rounded-l-full last:rounded-r-full transition-all`}
                style={{ width: `${(split.value / total) * 100}%` }}
                title={`${split.label}: ${split.value}`}
              />
            ))}
          </div>
          {/* Legend dots */}
          <div className="mt-3 flex flex-wrap gap-4">
            {splits.map((split) => (
              <span key={split.key} className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                <span className={`h-2 w-2 rounded-full bg-gradient-to-r ${split.gradient}`} />
                {split.label} ({((split.value / total) * 100).toFixed(0)}%)
              </span>
            ))}
          </div>
        </div>

        {/* Split cards */}
        <div className="space-y-3">
          {splits.map((split) => {
            const percent = (split.value / total) * 100;
            const Icon = split.icon;
            return (
              <div
                key={split.key}
                className={`hover-lift rounded-2xl border border-white/80 bg-gradient-to-br ${split.bgLight} p-5 shadow-[0_12px_30px_rgb(15_38_83_/0.06)] ring-1 ${split.ringColor} transition-all duration-300 ${split.glowColor}`}
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={`grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br ${split.gradient} text-white shadow-sm`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <p className="text-sm font-black text-foreground">{split.label}</p>
                  </div>
                  <div className="text-right">
                    <strong className="text-lg font-black">{formatNumber(split.value)}</strong>
                    <p className="text-[10px] font-bold text-muted-foreground">{percent.toFixed(1)}%</p>
                  </div>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-white/80 shadow-inner">
                  <div
                    className={`animate-progress-fill h-full rounded-full bg-gradient-to-r ${split.gradient} shadow-sm`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
