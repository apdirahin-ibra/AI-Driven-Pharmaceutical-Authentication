import { ArrowUpRight, Crown, Layers, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { modelPerformances } from "@/data/model-data";
import type { ModelPerformance } from "@/types/domain";

const maxAccuracy = Math.max(...modelPerformances.map((model) => model.accuracy));

interface ModelComparisonTableProps {
  onSelectModel: (model: ModelPerformance) => void;
}

const rankGradients = [
  "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-[0_0_12px_rgb(245_158_11_/0.3)]",
  "bg-gradient-to-br from-slate-300 to-slate-400 text-white shadow-sm",
  "bg-gradient-to-br from-amber-600 to-amber-700 text-white shadow-sm",
];

export function ModelComparisonTable({ onSelectModel }: ModelComparisonTableProps) {
  return (
    <Card className="glass-card-strong relative overflow-hidden rounded-3xl animate-fade-in-up stagger-3">
      <div className="absolute inset-0 neural-grid opacity-10" />
      <CardHeader className="relative flex-row items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary/10 to-indigo-100/80 text-primary shadow-sm ring-1 ring-primary/10">
            <Layers className="h-5 w-5" />
          </span>
          <div>
            <CardTitle className="text-lg">Model Comparison</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Benchmark results across {modelPerformances.length} evaluated architectures
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="gap-1.5 shadow-sm">
          <Trophy className="h-3 w-3" />
          {modelPerformances.length} models
        </Badge>
      </CardHeader>
      <CardContent className="relative overflow-x-auto">
        <table className="w-full min-w-[720px] border-separate border-spacing-y-2">
          <thead>
            <tr className="text-left text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              <th className="px-3 pb-1">Rank</th>
              <th className="px-3 pb-1">Model</th>
              <th className="px-3 pb-1">Architecture</th>
              <th className="px-3 pb-1">Accuracy</th>
              <th className="px-3 pb-1">Purpose</th>
              <th className="px-3 pb-1">Status</th>
              <th className="px-3 pb-1" />
            </tr>
          </thead>
          <tbody>
            {modelPerformances.map((model, index) => {
              const isSelected = model.status === "Selected Model";
              const width = (model.accuracy / maxAccuracy) * 100;
              const rankStyle = index < 3 ? rankGradients[index] : "bg-slate-100 text-slate-500";

              return (
                <tr
                  key={model.name}
                  className={`group rounded-2xl transition-all duration-300 ${
                    isSelected
                      ? "bg-gradient-to-r from-blue-50/90 via-indigo-50/40 to-transparent shadow-[0_0_24px_rgb(11_124_255_/0.06)]"
                      : "bg-white/50 hover:bg-blue-50/50 hover:shadow-sm"
                  }`}
                >
                  <td className="rounded-l-2xl px-3 py-3.5">
                    <span className={`inline-grid h-8 w-8 place-items-center rounded-lg text-[11px] font-black ${rankStyle}`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="px-3 py-3.5">
                    <p className="flex items-center gap-2 font-bold">
                      {model.name}
                      {isSelected && (
                        <Crown className="h-4 w-4 text-amber-500 drop-shadow-[0_0_4px_rgb(245_158_11_/0.5)]" style={{ animation: "float 3s ease-in-out infinite" }} />
                      )}
                    </p>
                  </td>
                  <td className="px-3 py-3.5">
                    <span className="inline-flex rounded-lg bg-slate-50 px-2 py-1 text-xs font-semibold text-muted-foreground ring-1 ring-slate-100">
                      {model.category}
                    </span>
                  </td>
                  <td className="px-3 py-3.5">
                    <div className="min-w-[160px]">
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <strong className={`text-sm ${isSelected ? "gradient-text" : "text-foreground"}`}>
                          {model.accuracy.toFixed(2)}%
                        </strong>
                        {isSelected && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-primary">
                            Best
                          </span>
                        )}
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100/80">
                        <div
                          className={`animate-progress-fill h-full rounded-full transition-all ${
                            isSelected
                              ? "bg-gradient-to-r from-primary via-indigo-500 to-violet-500 shadow-[0_0_8px_rgb(11_124_255_/0.3)]"
                              : "bg-gradient-to-r from-blue-200 to-blue-300"
                          }`}
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3.5 text-sm text-muted-foreground">{model.purpose}</td>
                  <td className="px-3 py-3.5">
                    <Badge
                      variant={isSelected ? "selected" : "secondary"}
                      className={isSelected ? "shadow-[0_0_12px_rgb(11_124_255_/0.15)]" : ""}
                    >
                      {model.status}
                    </Badge>
                  </td>
                  <td className="rounded-r-2xl px-3 py-3.5 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 rounded-xl border-blue-100 bg-white/80 transition-all duration-300 hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm"
                      onClick={() => onSelectModel(model)}
                    >
                      Details
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
