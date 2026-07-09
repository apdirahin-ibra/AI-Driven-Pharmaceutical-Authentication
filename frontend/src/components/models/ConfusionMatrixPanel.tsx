import { Grid3X3, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { modelFacts } from "@/lib/constants";

const fakeRow = modelFacts.confusionMatrix[0];
const realRow = modelFacts.confusionMatrix[1];
const total = fakeRow.predictedFake + fakeRow.predictedReal + realRow.predictedFake + realRow.predictedReal;
const correct = fakeRow.predictedFake + realRow.predictedReal;
const accuracy = ((correct / total) * 100).toFixed(1);

function cellStyle(value: number, max: number, isCorrect: boolean): string {
  const ratio = value / max;
  if (isCorrect) {
    if (ratio >= 0.85) return "bg-gradient-to-br from-emerald-50 to-cyan-50/80 text-emerald-800 ring-1 ring-emerald-100/80";
    if (ratio >= 0.5) return "bg-gradient-to-br from-indigo-100 to-blue-100/80 text-foreground ring-1 ring-blue-100/80";
    return "bg-gradient-to-br from-blue-50 to-indigo-50 text-foreground ring-1 ring-blue-100/60";
  }
  if (ratio >= 0.1) return "bg-gradient-to-br from-red-50 to-rose-50 text-red-700 ring-1 ring-red-100/70";
  return "bg-gradient-to-br from-orange-50 to-red-50 text-orange-700 ring-1 ring-orange-100/70";
}

export function ConfusionMatrixPanel() {
  const maxCell = Math.max(fakeRow.predictedFake, fakeRow.predictedReal, realRow.predictedFake, realRow.predictedReal);

  return (
    <Card className="glass-card-strong relative overflow-hidden rounded-[28px] border-blue-100/80 bg-white/92 animate-fade-in-up stagger-5">
      <div className="absolute inset-0 neural-grid opacity-[0.05]" />
      <CardHeader className="relative flex-row items-start justify-between gap-4 pb-3">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-primary/10 to-indigo-100/80 text-primary shadow-sm ring-1 ring-primary/10">
            <Grid3X3 className="h-5 w-5" />
          </span>
          <div>
            <CardTitle className="text-xl font-black tracking-tight">Confusion Matrix</CardTitle>
            <p className="mt-1 text-xs font-medium leading-5 text-muted-foreground">Test-set classification outcomes for the Improved CNN</p>
          </div>
        </div>
        {/* Accuracy badge */}
        <div className="glow-green relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 px-4 py-3 text-right ring-1 ring-emerald-200/60">
          <div className="shimmer absolute inset-0" />
          <div className="relative flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Overall Accuracy</p>
              <strong className="text-xl font-black text-emerald-700">{accuracy}%</strong>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative pt-2">
        <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="overflow-x-auto">
            <div className="mx-auto min-w-[620px] max-w-3xl">
              <div className="mb-3 flex items-center justify-center gap-3 text-[11px] font-black uppercase tracking-[0.16em] text-slate-600">
                <span className="h-px w-28 bg-blue-100" />
                Predicted
                <span className="h-px w-28 bg-blue-100" />
              </div>

              <div className="grid grid-cols-[112px_1fr_1fr] gap-3 text-center">
                <div className="flex items-end justify-center pb-2 text-[11px] font-black uppercase tracking-[0.14em] text-slate-600">Actual</div>
                <div className="rounded-2xl bg-red-50/80 px-4 py-3 ring-1 ring-red-100/70">
                  <p className="text-[11px] font-black uppercase text-fake">Fake <span className="font-semibold normal-case">(Suspicious)</span></p>
                </div>
                <div className="rounded-2xl bg-emerald-50/80 px-4 py-3 ring-1 ring-emerald-100/70">
                  <p className="text-[11px] font-black uppercase text-real">Real <span className="font-semibold normal-case">(Genuine)</span></p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-[112px_1fr_1fr] gap-3">
                <MatrixRowLabel tone="fake" title="Fake" subtitle="Suspicious" />
                <MatrixCell
                  value={fakeRow.predictedFake}
                  total={total}
                  style={cellStyle(fakeRow.predictedFake, maxCell, true)}
                  label="True Positive"
                />
                <MatrixCell
                  value={fakeRow.predictedReal}
                  total={total}
                  style={cellStyle(fakeRow.predictedReal, maxCell, false)}
                  label="False Negative"
                />
              </div>

              <div className="mt-3 grid grid-cols-[112px_1fr_1fr] gap-3">
                <MatrixRowLabel tone="real" title="Real" subtitle="Genuine" />
                <MatrixCell
                  value={realRow.predictedFake}
                  total={total}
                  style={cellStyle(realRow.predictedFake, maxCell, false)}
                  label="False Positive"
                />
                <MatrixCell
                  value={realRow.predictedReal}
                  total={total}
                  style={cellStyle(realRow.predictedReal, maxCell, true)}
                  label="True Negative"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <SummaryStat label="True Positives" value={fakeRow.predictedFake} percent={(fakeRow.predictedFake / total) * 100} tone="green" />
            <SummaryStat label="True Negatives" value={realRow.predictedReal} percent={(realRow.predictedReal / total) * 100} tone="blue" />
            <SummaryStat label="False Positives" value={realRow.predictedFake} percent={(realRow.predictedFake / total) * 100} tone="amber" />
            <SummaryStat label="False Negatives" value={fakeRow.predictedReal} percent={(fakeRow.predictedReal / total) * 100} tone="red" />
          </div>
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-muted-foreground">
          <LegendDot gradient="from-emerald-400 to-green-500" label="Correct Predictions (High)" />
          <LegendDot gradient="from-blue-500 to-indigo-500" label="Correct Predictions (Low)" />
          <LegendDot gradient="from-orange-400 to-amber-500" label="Misclassifications (Low)" />
          <LegendDot gradient="from-red-500 to-rose-500" label="Misclassifications (High)" />
        </div>
      </CardContent>
    </Card>
  );
}

function MatrixCell({
  value,
  total,
  style,
  label,
}: {
  value: number;
  total: number;
  style: string;
  label: string;
}) {
  return (
    <div className={`hover-lift group/cell relative min-h-[116px] overflow-hidden rounded-2xl p-5 text-center transition-all duration-300 ${style}`}>
      <strong className="block text-3xl font-black">{value}</strong>
      <span className="mt-1 block text-[10px] font-semibold opacity-75">
        {((value / total) * 100).toFixed(1)}% of total
      </span>
      <span className="mt-2 block text-[10px] font-black uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}

function MatrixRowLabel({ tone, title, subtitle }: { tone: "fake" | "real"; title: string; subtitle: string }) {
  const styles =
    tone === "fake"
      ? "bg-red-50/90 text-fake ring-red-100/70"
      : "bg-emerald-50/90 text-real ring-emerald-100/70";

  return (
    <div className={`grid min-h-[116px] place-items-center rounded-2xl text-center ring-1 ${styles}`}>
      <div>
        <p className="text-xs font-black uppercase">{title}</p>
        <p className="mt-1 text-[11px] font-semibold">({subtitle})</p>
      </div>
    </div>
  );
}

function LegendDot({ gradient, label }: { gradient: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`h-3 w-3 rounded-md bg-gradient-to-br ${gradient}`} />
      {label}
    </span>
  );
}

function SummaryStat({ label, value, percent, tone }: { label: string; value: number; percent: number; tone: "green" | "blue" | "amber" | "red" }) {
  const toneMap = {
    green: "border-emerald-100/70 bg-emerald-50/70 text-emerald-700",
    blue: "border-blue-100/70 bg-blue-50/70 text-primary",
    amber: "border-amber-100/70 bg-amber-50/70 text-amber-700",
    red: "border-red-100/70 bg-red-50/70 text-red-600",
  };

  return (
    <div className={`rounded-2xl border p-5 text-center shadow-sm transition-all hover:shadow-md ${toneMap[tone]}`}>
      <strong className="block text-3xl font-black">{value}</strong>
      <p className="mt-1 text-[10px] font-black uppercase tracking-wider">{label}</p>
      <p className="mt-1 text-[10px] font-semibold opacity-70">{percent.toFixed(1)}% of total</p>
    </div>
  );
}
