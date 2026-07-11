import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDownUp, CheckCircle2, Database, Gauge, Grid3X3, Layers, ShieldCheck, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/layout/PageHeader";
import { modelPerformances } from "@/data/model-data";
import { modelFacts } from "@/lib/constants";
import { getEvaluationMetrics } from "@/lib/model-metrics";
import { formatNumber, formatPercent } from "@/lib/utils";

export function ModelsPage() {
  const [descending, setDescending] = useState(true);
  const metrics = getEvaluationMetrics();
  const sortedModels = useMemo(
    () => [...modelPerformances].sort((a, b) => descending ? b.accuracy - a.accuracy : a.accuracy - b.accuracy),
    [descending],
  );

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="AI Models"
        title="AI Model Performance"
        description="Compare evaluated pharmaceutical image classification models and monitor the active production model."
        action={<div className="flex flex-wrap gap-2"><HeaderFact label="Production" value={modelFacts.selectedModel} /><HeaderFact label="Evaluated" value={`${modelPerformances.length} models`} /><HeaderFact label="Dataset" value={modelFacts.datasetVersion || "Version not recorded"} /></div>}
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryMetric label="Accuracy" value={formatPercent(metrics.accuracy, 2)} detail="Test set" Icon={Target} />
        <SummaryMetric label="Fake Recall" value={formatPercent(metrics.recall, 2)} detail="Fake is the positive class" Icon={ShieldCheck} />
        <SummaryMetric label="False Positives" value={formatNumber(metrics.fp)} detail={`${formatPercent(metrics.falsePositiveRate, 2)} of real images`} Icon={Gauge} />
        <SummaryMetric label="Test Images" value={formatNumber(metrics.total)} detail="Confusion-matrix total" Icon={Database} />
      </section>

      <section className="grid gap-5 xl:grid-cols-12">
        <AccuracyChart className="xl:col-span-7" />
        <ProductionModel className="xl:col-span-5" />
      </section>

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-3 p-5 pb-3">
          <div><CardTitle className="text-lg">Model Comparison</CardTitle><p className="mt-1 text-xs text-muted-foreground">All {modelPerformances.length} evaluations from the same model catalog.</p></div>
          <Button type="button" variant="outline" size="sm" onClick={() => setDescending((current) => !current)}><ArrowDownUp className="h-4 w-4" />Accuracy {descending ? "high to low" : "low to high"}</Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Rank</TableHead><TableHead>Model</TableHead><TableHead>Architecture</TableHead><TableHead>Accuracy</TableHead><TableHead>Fake Recall</TableHead><TableHead>Test Loss</TableHead><TableHead>Purpose</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>{sortedModels.map((model, index) => <TableRow key={model.name} className={model.status === "Selected Model" ? "bg-blue-50/60" : undefined}><TableCell className="font-bold">{index + 1}</TableCell><TableCell className="whitespace-nowrap font-bold">{model.name}</TableCell><TableCell>{model.category}</TableCell><TableCell className="font-bold">{formatAccuracy(model.accuracy)}</TableCell><TableCell>{model.fakeRecall === undefined ? "—" : formatAccuracy(model.fakeRecall)}</TableCell><TableCell>{model.testLoss === undefined ? "—" : model.testLoss.toFixed(4)}</TableCell><TableCell>{model.purpose}</TableCell><TableCell><Badge variant={model.status === "Selected Model" ? "selected" : "secondary"}>{model.status === "Selected Model" ? "Production" : "Evaluated"}</Badge></TableCell></TableRow>)}</TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-5 xl:grid-cols-12">
        <ConfusionMatrix className="xl:col-span-8" />
        <EvaluationMetrics className="xl:col-span-4" />
      </section>

      <section className="grid gap-5 xl:grid-cols-12">
        <DatasetSummary className="xl:col-span-8" />
        <DecisionConfiguration className="xl:col-span-4" />
      </section>
    </div>
  );
}

function HeaderFact({ label, value }: { label: string; value: string }) { return <div className="min-w-[140px] rounded-xl border border-border bg-white px-3 py-2 shadow-sm"><span className="block text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</span><strong className="block truncate text-sm" title={value}>{value}</strong></div>; }

function SummaryMetric({ label, value, detail, Icon }: { label: string; value: string; detail: string; Icon: typeof Target }) { return <Card className="shadow-sm"><CardContent className="flex items-center gap-3 p-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-primary"><Icon className="h-5 w-5" /></span><div><p className="text-xs text-muted-foreground">{label}</p><strong className="block text-xl font-black">{value}</strong><span className="text-xs text-muted-foreground">{detail}</span></div></CardContent></Card>; }

function AccuracyChart({ className }: { className?: string }) { return <Card className={className}><CardHeader className="p-5 pb-2"><CardTitle className="text-lg">Model Accuracy Comparison</CardTitle><p className="text-xs text-muted-foreground">Test accuracy from 0–100%; production is highlighted in blue.</p></CardHeader><CardContent className="p-5 pt-2"><div className="h-[310px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={modelPerformances} margin={{ top: 16, right: 8, left: -12, bottom: 8 }}><CartesianGrid vertical={false} stroke="#e4edf8" /><XAxis dataKey="name" interval={0} tick={{ fontSize: 10, fill: "#607193" }} axisLine={false} tickLine={false} /><YAxis domain={[0, 100]} tickFormatter={(value: number) => `${value}%`} tick={{ fontSize: 10, fill: "#607193" }} axisLine={false} tickLine={false} /><Tooltip formatter={(value) => [`${Number(value).toFixed(2)}%`, "Accuracy"]} /><Bar dataKey="accuracy" radius={[8, 8, 0, 0]}>{modelPerformances.map((model) => <Cell key={model.name} fill={model.status === "Selected Model" ? "#0b7cff" : "#c8dcf5"} />)}</Bar></BarChart></ResponsiveContainer></div></CardContent></Card>; }

function ProductionModel({ className }: { className?: string }) { return <Card className={className}><CardHeader className="flex-row items-start justify-between p-5 pb-3"><div><p className="text-[11px] font-bold uppercase tracking-[0.15em] text-primary">Production Model</p><CardTitle className="mt-1 text-2xl">{modelFacts.selectedModel}</CardTitle></div><Badge variant="selected" className="gap-1"><CheckCircle2 className="h-3.5 w-3.5" />Active</Badge></CardHeader><CardContent className="p-5 pt-0"><div className="border-b border-border pb-4"><strong className="text-4xl font-black text-primary">{formatPercent(modelFacts.testAccuracy, 2)}</strong><span className="ml-2 text-sm text-muted-foreground">accuracy</span></div><dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-4"><ModelDetail label="Architecture" value="Improved CNN Architecture" /><ModelDetail label="Model version" value={modelFacts.modelVersion || "Not recorded"} /><ModelDetail label="Input size" value={modelFacts.inputSize} /><ModelDetail label="Test loss" value={modelFacts.testLoss.toFixed(4)} /><ModelDetail label="Model artifact" value={modelFacts.modelFile} /><ModelDetail label="Evaluated at" value={modelFacts.evaluatedAt || "Not recorded"} /></dl></CardContent></Card>; }
function ModelDetail({ label, value }: { label: string; value: string }) { return <div className="min-w-0"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-0.5 truncate text-sm font-bold" title={value}>{value}</dd></div>; }

function ConfusionMatrix({ className }: { className?: string }) { const m=getEvaluationMetrics(); return <Card className={className}><CardHeader className="p-5 pb-3"><div className="flex items-center gap-2"><Grid3X3 className="h-5 w-5 text-primary" /><CardTitle className="text-lg">Confusion Matrix</CardTitle></div><p className="text-xs text-muted-foreground">Positive class: Fake. Counts total {m.total} test images.</p></CardHeader><CardContent className="p-5 pt-0"><div className="grid grid-cols-[96px_1fr_1fr] gap-2 text-center"><span /><MatrixHeader label="Predicted Fake" /><MatrixHeader label="Predicted Real" /><MatrixHeader label="Actual Fake" /><MatrixCell value={m.tp} label="True positive" tone="success" /><MatrixCell value={m.fn} label="False negative" tone="danger" /><MatrixHeader label="Actual Real" /><MatrixCell value={m.fp} label="False positive" tone="warning" /><MatrixCell value={m.tn} label="True negative" tone="success" /></div></CardContent></Card>; }
function MatrixHeader({ label }: { label: string }) { return <div className="grid min-h-12 place-items-center rounded-lg bg-slate-100 px-2 text-xs font-bold">{label}</div>; }
function MatrixCell({ value, label, tone }: { value: number; label: string; tone: "success" | "danger" | "warning" }) { const styles={success:"border-green-200 bg-green-50 text-green-800",danger:"border-red-200 bg-red-50 text-red-700",warning:"border-amber-200 bg-amber-50 text-amber-700"}; return <div className={`grid min-h-24 place-items-center rounded-xl border p-3 ${styles[tone]}`}><div><strong className="block text-2xl">{value}</strong><span className="text-xs font-semibold">{label}</span></div></div>; }

function EvaluationMetrics({ className }: { className?: string }) { const m=getEvaluationMetrics(); const rows=[['Accuracy',m.accuracy],['Precision',m.precision],['Recall / Sensitivity',m.recall],['Specificity',m.specificity],['F1 Score',m.f1],['False Positive Rate',m.falsePositiveRate],['False Negative Rate',m.falseNegativeRate]] as const; return <Card className={className}><CardHeader className="p-5 pb-3"><CardTitle className="text-lg">Evaluation Metrics</CardTitle><p className="text-xs text-muted-foreground">Derived directly from TP, TN, FP, and FN.</p></CardHeader><CardContent className="divide-y divide-border p-5 pt-0">{rows.map(([label,value]) => <div key={label} className="flex justify-between gap-3 py-2.5 text-sm"><span className="text-muted-foreground">{label}</span><strong>{formatPercent(value,2)}</strong></div>)}</CardContent></Card>; }

function DatasetSummary({ className }: { className?: string }) { const dataset=modelFacts.dataset; const splits=[['Training',dataset.training],['Validation',dataset.validation],['Testing',dataset.testing]] as const; return <Card className={className}><CardHeader className="flex-row items-start justify-between p-5 pb-3"><div><CardTitle className="text-lg">Dataset Summary</CardTitle><p className="mt-1 text-xs text-muted-foreground">Split totals and derived percentages.</p></div><div className="text-right"><span className="block text-xs text-muted-foreground">Total images</span><strong className="text-xl">{formatNumber(dataset.total)}</strong></div></CardHeader><CardContent className="grid gap-3 p-5 pt-0 sm:grid-cols-3">{splits.map(([label,value]) => <div key={label} className="rounded-xl border border-border p-4"><span className="text-xs text-muted-foreground">{label}</span><strong className="mt-1 block text-2xl">{formatNumber(value)}</strong><span className="text-xs font-semibold text-primary">{((value/dataset.total)*100).toFixed(1)}%</span></div>)}</CardContent></Card>; }

function DecisionConfiguration({ className }: { className?: string }) { return <Card className={className}><CardHeader className="p-5 pb-3"><div className="flex items-center gap-2"><Layers className="h-5 w-5 text-primary" /><CardTitle className="text-lg">Decision Configuration</CardTitle></div><p className="text-xs text-muted-foreground">Runtime classification settings, not performance KPIs.</p></CardHeader><CardContent className="space-y-3 p-5 pt-0"><ConfigRow label="Suspicious threshold" value={formatPercent(modelFacts.suspiciousThreshold,0)} /><ConfigRow label="Output classes" value={modelFacts.outputClasses} /><ConfigRow label="Input size" value={modelFacts.inputSize} /></CardContent></Card>; }
function ConfigRow({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5"><span className="text-sm text-muted-foreground">{label}</span><strong className="text-sm">{value}</strong></div>; }

function formatAccuracy(value: number) { return `${value.toFixed(2)}%`; }
