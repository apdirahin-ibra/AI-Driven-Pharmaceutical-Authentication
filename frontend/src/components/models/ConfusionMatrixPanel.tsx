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
    if (ratio >= 0.85) return "bg-gradient-to-br from-primary/85 to-indigo-600/90 text-white shadow-[0_0_24px_rgb(11_124_255_/0.2)]";
    if (ratio >= 0.5) return "bg-gradient-to-br from-primary/40 to-indigo-500/30 text-foreground";
    return "bg-gradient-to-br from-primary/15 to-blue-100/60 text-foreground";
  }
  if (ratio >= 0.1) return "bg-gradient-to-br from-red-50 to-orange-50 text-muted-foreground ring-1 ring-red-100/50";
  return "bg-gradient-to-br from-slate-50 to-blue-50/40 text-muted-foreground";
}

export function ConfusionMatrixPanel() {
  const maxCell = Math.max(fakeRow.predictedFake, fakeRow.predictedReal, realRow.predictedFake, realRow.predictedReal);

  return (
    <Card className="glass-card-strong relative overflow-hidden rounded-3xl animate-fade-in-up stagger-5">
      <div className="absolute inset-0 neural-grid opacity-10" />
      <CardHeader className="relative flex-row items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary/10 to-indigo-100/80 text-primary shadow-sm ring-1 ring-primary/10">
            <Grid3X3 className="h-5 w-5" />
          </span>
          <div>
            <CardTitle className="text-lg">Confusion Matrix</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">Test-set classification outcomes for the Improved CNN</p>
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
      <CardContent className="relative">
        <div className="overflow-x-auto">
          <div className="mx-auto max-w-xl">
            {/* Column headers */}
            <div className="grid grid-cols-[140px_1fr_1fr] gap-3 text-center">
              <div />
              <div className="rounded-xl bg-gradient-to-br from-red-50 to-orange-50/80 px-3 py-2.5 ring-1 ring-red-100/40">
                <p className="text-[11px] font-bold uppercase tracking-wide text-fake">Predicted Fake</p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-green-50/80 px-3 py-2.5 ring-1 ring-emerald-100/40">
                <p className="text-[11px] font-bold uppercase tracking-wide text-real">Predicted Real</p>
              </div>
            </div>

            {/* Row: Actual Fake */}
            <div className="mt-3 grid grid-cols-[140px_1fr_1fr] gap-3">
              <div className="flex items-center justify-end pr-3">
                <span className="rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-bold uppercase tracking-wide text-fake ring-1 ring-red-100/40">
                  Actual Fake
                </span>
              </div>
              <MatrixCell
                value={fakeRow.predictedFake}
                total={total}
                style={cellStyle(fakeRow.predictedFake, maxCell, true)}
                label="True Negative"
              />
              <MatrixCell
                value={fakeRow.predictedReal}
                total={total}
                style={cellStyle(fakeRow.predictedReal, maxCell, false)}
                label="False Positive"
              />
            </div>

            {/* Row: Actual Real */}
            <div className="mt-3 grid grid-cols-[140px_1fr_1fr] gap-3">
              <div className="flex items-center justify-end pr-3">
                <span className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-bold uppercase tracking-wide text-real ring-1 ring-emerald-100/40">
                  Actual Real
                </span>
              </div>
              <MatrixCell
                value={realRow.predictedFake}
                total={total}
                style={cellStyle(realRow.predictedFake, maxCell, false)}
                label="False Negative"
              />
              <MatrixCell
                value={realRow.predictedReal}
                total={total}
                style={cellStyle(realRow.predictedReal, maxCell, true)}
                label="True Positive"
              />
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-5 text-xs text-muted-foreground">
          <LegendDot gradient="from-primary/85 to-indigo-600/90" label="Correct predictions (high)" />
          <LegendDot gradient="from-primary/15 to-blue-100/60" label="Correct predictions (low)" />
          <LegendDot gradient="from-red-50 to-orange-50" label="Misclassifications" />
        </div>

        {/* Summary stats */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryStat label="True Positives" value={realRow.predictedReal} tone="green" />
          <SummaryStat label="True Negatives" value={fakeRow.predictedFake} tone="blue" />
          <SummaryStat label="False Positives" value={fakeRow.predictedReal} tone="amber" />
          <SummaryStat label="False Negatives" value={realRow.predictedFake} tone="red" />
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
    <div className={`hover-lift group/cell relative overflow-hidden rounded-2xl p-5 text-center transition-all duration-300 ${style}`}>
      <strong className="block text-3xl font-black">{value}</strong>
      <span className="mt-1 block text-[11px] font-semibold opacity-75">
        {((value / total) * 100).toFixed(1)}% of total
      </span>
      <span className="mt-1.5 block text-[9px] font-bold uppercase tracking-wider opacity-50">
        {label}
      </span>
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

function SummaryStat({ label, value, tone }: { label: string; value: number; tone: "green" | "blue" | "amber" | "red" }) {
  const toneMap = {
    green: "border-emerald-100/60 bg-emerald-50/50 text-emerald-700",
    blue: "border-blue-100/60 bg-blue-50/50 text-primary",
    amber: "border-amber-100/60 bg-amber-50/50 text-amber-700",
    red: "border-red-100/60 bg-red-50/50 text-red-600",
  };

  return (
    <div className={`rounded-xl border p-3 text-center transition-all hover:shadow-sm ${toneMap[tone]}`}>
      <strong className="block text-lg font-black">{value}</strong>
      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider opacity-70">{label}</p>
    </div>
  );
}
