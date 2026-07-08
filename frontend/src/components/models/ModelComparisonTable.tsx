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
      <CardContent className="relative">
        <div className="mb-2 hidden grid-cols-[54px_minmax(120px,1fr)_minmax(120px,0.95fr)_minmax(150px,1.05fr)_minmax(120px,0.9fr)_minmax(132px,0.72fr)] gap-3 px-4 text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground 2xl:grid">
          <span>Rank</span>
          <span>Model</span>
          <span>Architecture</span>
          <span>Accuracy</span>
          <span>Purpose</span>
          <span>Status</span>
        </div>

        <div className="space-y-3">
          {modelPerformances.map((model, index) => (
            <ModelRow key={model.name} model={model} index={index} onSelectModel={onSelectModel} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ModelRow({
  model,
  index,
  onSelectModel,
}: {
  model: ModelPerformance;
  index: number;
  onSelectModel: (model: ModelPerformance) => void;
}) {
  const isSelected = model.status === "Selected Model";
  const width = (model.accuracy / maxAccuracy) * 100;
  const rankStyle = index < 3 ? rankGradients[index] : "bg-slate-100 text-slate-500";

  return (
    <div
      className={`group rounded-2xl border p-4 shadow-sm transition-all duration-300 ${
        isSelected
          ? "border-primary/20 bg-gradient-to-r from-blue-50/95 via-indigo-50/70 to-white shadow-[0_16px_34px_rgb(11_124_255_/0.08)]"
          : "border-blue-100/70 bg-white/78 hover:border-primary/20 hover:bg-blue-50/50 hover:shadow-[0_14px_32px_rgb(15_38_83_/0.08)]"
      }`}
    >
      <div className="grid items-center gap-4 2xl:grid-cols-[54px_minmax(120px,1fr)_minmax(120px,0.95fr)_minmax(150px,1.05fr)_minmax(120px,0.9fr)_minmax(132px,0.72fr)]">
        <div className="flex items-center justify-between gap-3 2xl:block">
          <span className={`inline-grid h-8 w-8 place-items-center rounded-xl text-[11px] font-black ${rankStyle}`}>
            {index + 1}
          </span>
          <Badge
            variant={isSelected ? "selected" : "secondary"}
            className={`2xl:hidden ${isSelected ? "shadow-[0_0_12px_rgb(11_124_255_/0.15)]" : ""}`}
          >
            {model.status}
          </Badge>
        </div>

        <div className="min-w-0">
          <p className="flex items-center gap-2 font-black leading-snug text-foreground">
            <span className="truncate">{model.name}</span>
            {isSelected && (
              <Crown className="h-4 w-4 shrink-0 text-amber-500 drop-shadow-[0_0_4px_rgb(245_158_11_/0.5)]" style={{ animation: "float 3s ease-in-out infinite" }} />
            )}
          </p>
          <p className="mt-1 text-xs font-medium text-muted-foreground 2xl:hidden">{model.purpose}</p>
        </div>

        <div>
          <p className="mb-1 text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground 2xl:hidden">Architecture</p>
          <span className="inline-flex max-w-full rounded-xl bg-white/82 px-2.5 py-1.5 text-xs font-bold leading-tight text-slate-600 ring-1 ring-blue-100/70">
            {model.category}
          </span>
        </div>

        <div className="min-w-0">
          <div className="mb-2 flex items-center justify-between gap-2">
            <strong className={`text-sm font-black ${isSelected ? "gradient-text" : "text-foreground"}`}>
              {model.accuracy.toFixed(2)}%
            </strong>
            {isSelected && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-primary">
                Best
              </span>
            )}
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100/90 shadow-inner">
            <div
              className={`animate-progress-fill h-full rounded-full transition-all ${
                isSelected
                  ? "bg-gradient-to-r from-primary via-indigo-500 to-violet-500 shadow-[0_0_10px_rgb(11_124_255_/0.28)]"
                  : "bg-gradient-to-r from-blue-200 to-blue-300"
              }`}
              style={{ width: `${width}%` }}
            />
          </div>
        </div>

        <p className="hidden text-sm font-medium leading-5 text-muted-foreground 2xl:block">{model.purpose}</p>

        <div className="flex items-center justify-between gap-3 2xl:justify-end">
          <Badge
            variant={isSelected ? "selected" : "secondary"}
            className={`hidden 2xl:inline-flex ${isSelected ? "shadow-[0_0_12px_rgb(11_124_255_/0.15)]" : ""}`}
          >
            {model.status}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 rounded-xl border-blue-100 bg-white/90 px-3 font-bold transition-all duration-300 hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm"
            onClick={() => onSelectModel(model)}
          >
            Details
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
