import { useState } from "react";
import { Box, Brain, Database, ShieldCheck, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/layout/PageHeader";
import { ModelAccuracyChart } from "@/components/models/ModelAccuracyChart";
import { modelPerformances } from "@/data/model-data";
import { modelFacts } from "@/lib/constants";
import { formatNumber, formatPercent } from "@/lib/utils";
import type { ModelPerformance } from "@/types/domain";

export function ModelsPage() {
  const [selectedModel, setSelectedModel] = useState<ModelPerformance | null>(null);
  const improved = modelPerformances[0];

  return (
    <div>
      <PageHeader
        eyebrow="AI Models"
        title="AI Model Performance"
        description="Compare trained pharmaceutical image classification models and review the selected production model."
      />
      <div className="grid gap-5 xl:grid-cols-[0.82fr_1.18fr]">
        <Card className="border-blue-300">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Selected Model</CardTitle>
            <Badge variant="selected">Selected Model</Badge>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-[220px_1fr]">
              <div className="blue-grid grid h-56 place-items-center rounded-[1.5rem] border border-blue-200 bg-blue-50">
                <Box className="h-24 w-24 text-primary" />
              </div>
              <div>
                <h2 className="text-3xl font-black">{improved.name}</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  The Improved CNN was selected because it achieved the strongest overall performance among the single deep learning models and provided high fake medicine recall.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <ModelMetric label="Test Accuracy" value={formatPercent(modelFacts.testAccuracy)} />
                  <ModelMetric label="Fake Recall" value={formatPercent(modelFacts.fakeRecall, 0)} />
                  <ModelMetric label="Test Loss" value={modelFacts.testLoss.toString()} />
                  <ModelMetric label="Suspicious Threshold" value={formatPercent(modelFacts.suspiciousThreshold, 0)} />
                  <ModelMetric label="Model File" value={modelFacts.modelFile} className="sm:col-span-2" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Accuracy Comparison</CardTitle></CardHeader>
          <CardContent><ModelAccuracyChart /></CardContent>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_0.78fr]">
        <Card>
          <CardHeader><CardTitle>Model Comparison</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Model</TableHead><TableHead>Architecture</TableHead><TableHead>Accuracy</TableHead><TableHead>Purpose</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader>
              <TableBody>
                {modelPerformances.map((model) => (
                  <TableRow key={model.name}>
                    <TableCell className="font-semibold">{model.name}</TableCell>
                    <TableCell>{model.category}</TableCell>
                    <TableCell>{model.accuracy.toFixed(2)}%</TableCell>
                    <TableCell>{model.purpose}</TableCell>
                    <TableCell><Badge variant={model.status === "Selected Model" ? "selected" : "secondary"}>{model.status}</Badge></TableCell>
                    <TableCell><Button variant="outline" size="sm" onClick={() => setSelectedModel(model)}>Details</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Dataset Summary</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            <ModelMetric label="Total Images" value={formatNumber(modelFacts.dataset.total)} />
            <ModelMetric label="Training" value={formatNumber(modelFacts.dataset.training)} />
            <ModelMetric label="Validation" value={formatNumber(modelFacts.dataset.validation)} />
            <ModelMetric label="Testing" value={formatNumber(modelFacts.dataset.testing)} />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader><CardTitle>Confusion Matrix</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Actual Class</TableHead><TableHead>Predicted Fake</TableHead><TableHead>Predicted Real</TableHead></TableRow></TableHeader>
            <TableBody>
              {modelFacts.confusionMatrix.map((row) => (
                <TableRow key={row.actual}>
                  <TableCell className="font-semibold">{row.actual}</TableCell>
                  <TableCell>{row.predictedFake}</TableCell>
                  <TableCell>{row.predictedReal}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedModel)} onOpenChange={(open) => !open && setSelectedModel(null)}>
        {selectedModel && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedModel.name}</DialogTitle>
              <DialogDescription>{selectedModel.category} for {selectedModel.purpose.toLowerCase()}.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 sm:grid-cols-2">
              <ModelMetric label="Architecture Type" value={selectedModel.category} />
              <ModelMetric label="Test Accuracy" value={`${selectedModel.accuracy.toFixed(2)}%`} />
              <ModelMetric label="Training Approach" value={selectedModel.name === "Improved CNN" ? "Custom trained CNN" : "Evaluated comparison model"} />
              <ModelMetric label="Status" value={selectedModel.status} />
              {selectedModel.name === "Improved CNN" && (
                <>
                  <ModelMetric label="Test Loss" value={modelFacts.testLoss.toString()} />
                  <ModelMetric label="Input Size" value={modelFacts.inputSize} />
                  <ModelMetric label="Output Classes" value={modelFacts.outputClasses} />
                  <ModelMetric label="Fake Metrics" value="Precision 89%, Recall 94%, F1-score 91%" />
                  <ModelMetric label="Real Metrics" value="Precision 96%, Recall 93%, F1-score 95%" className="sm:col-span-2" />
                </>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

function ModelMetric({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={`rounded-2xl border border-border bg-muted/60 p-4 ${className}`}>
      <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
        {label === "Fake Recall" ? <ShieldCheck className="h-4 w-4" /> : label === "Test Accuracy" ? <Target className="h-4 w-4" /> : label.includes("Images") || label === "Training" || label === "Validation" || label === "Testing" ? <Database className="h-4 w-4" /> : <Brain className="h-4 w-4" />}
        {label}
      </p>
      <strong className="mt-2 block text-lg">{value}</strong>
    </div>
  );
}
