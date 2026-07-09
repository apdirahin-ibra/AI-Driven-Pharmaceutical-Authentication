import { useState } from "react";
import { Activity, Brain, Crown, Layers, Sparkles, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/layout/PageHeader";
import { ConfusionMatrixPanel } from "@/components/models/ConfusionMatrixPanel";
import { DatasetSplitPanel } from "@/components/models/DatasetSplitPanel";
import { ModelAccuracyChart } from "@/components/models/ModelAccuracyChart";
import { ModelComparisonTable } from "@/components/models/ModelComparisonTable";
import { SelectedModelHero } from "@/components/models/SelectedModelHero";
import { modelPerformances } from "@/data/model-data";
import { modelFacts } from "@/lib/constants";
import { formatPercent } from "@/lib/utils";
import type { ModelPerformance } from "@/types/domain";

export function ModelsPage() {
  const [selectedModel, setSelectedModel] = useState<ModelPerformance | null>(null);
  const evaluatedCount = modelPerformances.filter((model) => model.status === "Evaluated").length;

  return (
    <div>
      <PageHeader
        eyebrow="AI Models"
        title="AI Model Performance"
        description="Compare trained pharmaceutical image classification models and review the selected production model."
        action={
          <div className="flex flex-wrap gap-2">
            <QuickStat icon={Sparkles} label="Production" value={modelFacts.selectedModel} tone="purple" />
            <QuickStat icon={Layers} label="Evaluated" value={`${evaluatedCount} models`} tone="blue" />
            <QuickStat icon={Activity} label="Accuracy" value={formatPercent(modelFacts.testAccuracy)} tone="green" />
          </div>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)]">
        <SelectedModelHero />
        <ModelAccuracyChart />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.22fr)_minmax(360px,0.78fr)]">
        <ModelComparisonTable onSelectModel={setSelectedModel} />
        <DatasetSplitPanel />
      </div>

      <div className="mt-5">
        <ConfusionMatrixPanel />
      </div>

      {/* Premium Model Detail Dialog */}
      <Dialog open={Boolean(selectedModel)} onOpenChange={(open) => !open && setSelectedModel(null)}>
        {selectedModel && (
          <DialogContent className="glass-card-strong max-w-lg rounded-3xl border-0 p-0 overflow-hidden">
            {/* Dialog header with gradient */}
            <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-indigo-50/50 to-violet-50/30 px-6 pt-6 pb-5">
              <div className="neural-grid absolute inset-0 opacity-20" />
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgb(99_102_241_/0.12),transparent_70%)]" />
              <DialogHeader className="relative">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <DialogTitle className="text-2xl font-black">
                      <span className="gradient-text">{selectedModel.name}</span>
                    </DialogTitle>
                    <DialogDescription className="mt-1.5 flex items-center gap-2">
                      <span className="inline-flex rounded-lg bg-white/80 px-2 py-0.5 text-xs font-semibold ring-1 ring-primary/10">
                        {selectedModel.category}
                      </span>
                    </DialogDescription>
                  </div>
                  <Badge
                    variant={selectedModel.status === "Selected Model" ? "selected" : "secondary"}
                    className={selectedModel.status === "Selected Model" ? "gap-1 shadow-[0_0_12px_rgb(11_124_255_/0.15)]" : ""}
                  >
                    {selectedModel.status === "Selected Model" && <Crown className="h-3 w-3" />}
                    {selectedModel.status}
                  </Badge>
                </div>
              </DialogHeader>
            </div>

            {/* Dialog body */}
            <div className="px-6 pb-6 pt-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <DetailMetric label="Architecture" value={selectedModel.category} />
                <DetailMetric label="Test Accuracy" value={`${selectedModel.accuracy.toFixed(2)}%`} highlight />
                <DetailMetric label="Purpose" value={selectedModel.purpose} className="sm:col-span-2" />
                <DetailMetric
                  label="Training Approach"
                  value={selectedModel.name === "Improved CNN" ? "Improved CNN training" : "Transfer learning benchmark"}
                />
                <DetailMetric label="Status" value={selectedModel.status} />
                {selectedModel.name === "Improved CNN" && (
                  <>
                    <DetailMetric label="Test Loss" value={modelFacts.testLoss.toString()} />
                    <DetailMetric label="Input Size" value={modelFacts.inputSize} />
                    <DetailMetric label="Output Classes" value={modelFacts.outputClasses} />
                    <DetailMetric label="Model File" value={modelFacts.modelFile} />
                    <DetailMetric
                      label="Fake Metrics"
                      value={`Precision ${formatPercent(modelFacts.fakeMetrics.precision, 0)}, Recall ${formatPercent(modelFacts.fakeMetrics.recall, 0)}, F1 ${formatPercent(modelFacts.fakeMetrics.f1, 0)}`}
                      className="sm:col-span-2"
                    />
                    <DetailMetric
                      label="Real Metrics"
                      value={`Precision ${formatPercent(modelFacts.realMetrics.precision, 0)}, Recall ${formatPercent(modelFacts.realMetrics.recall, 0)}, F1 ${formatPercent(modelFacts.realMetrics.f1, 0)}`}
                      className="sm:col-span-2"
                    />
                  </>
                )}
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

function QuickStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Brain;
  label: string;
  value: string;
  tone: "blue" | "green" | "purple";
}) {
  const toneStyles = {
    blue: "border-blue-100/80 bg-white hover:shadow-[0_14px_34px_rgb(11_124_255_/0.10)] text-primary",
    green: "border-emerald-100/80 bg-gradient-to-r from-white to-emerald-50/60 hover:shadow-[0_14px_34px_rgb(34_197_94_/0.10)] text-emerald-600",
    purple: "border-violet-100/80 bg-gradient-to-r from-white to-violet-50/60 hover:shadow-[0_14px_34px_rgb(139_92_246_/0.10)] text-violet-600",
  };

  return (
    <div className={`hover-lift flex min-w-[152px] items-center gap-3 rounded-2xl border px-4 py-3.5 shadow-[0_10px_30px_rgb(15_38_83_/0.06)] transition-all duration-300 ${toneStyles[tone]}`}>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white shadow-sm ring-1 ring-current/10">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase leading-4 tracking-[0.16em] text-muted-foreground">{label}</p>
        <strong className="block text-sm font-black leading-5 text-foreground">{value}</strong>
      </div>
    </div>
  );
}

function DetailMetric({
  label,
  value,
  highlight = false,
  className = "",
}: {
  label: string;
  value: string;
  highlight?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 transition-all duration-200 hover:shadow-sm ${
        highlight
          ? "border-primary/20 bg-gradient-to-br from-blue-50/80 to-indigo-50/40 shadow-[0_0_12px_rgb(11_124_255_/0.06)]"
          : "border-border/60 bg-gradient-to-br from-muted/30 to-white"
      } ${className}`}
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <strong className={`mt-2 block text-sm font-black leading-6 ${highlight ? "gradient-text" : ""}`}>{value}</strong>
    </div>
  );
}
