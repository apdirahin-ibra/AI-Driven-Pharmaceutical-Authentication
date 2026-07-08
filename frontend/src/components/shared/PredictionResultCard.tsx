import { CheckCircle2, ShieldAlert, TriangleAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ConfidenceProgress } from "@/components/shared/ConfidenceProgress";
import { formatPercent } from "@/lib/utils";
import type { PredictionResponse } from "@/types/domain";

interface PredictionResultCardProps {
  result: PredictionResponse;
  onCreateReport?: () => void;
}

const resultCopy = {
  Real: {
    title: "Medicine Appears Real",
    message: "The uploaded image matches visual patterns learned from real medicine samples.",
    Icon: CheckCircle2,
    tone: "text-real bg-green-50 border-green-200",
  },
  Fake: {
    title: "Potential Fake Medicine Detected",
    message: "The image matches visual patterns associated with fake medicine samples. Manual verification is recommended before use or sale.",
    Icon: ShieldAlert,
    tone: "text-fake bg-red-50 border-red-200",
  },
  Suspicious: {
    title: "Manual Review Required",
    message: "The model confidence is below the 75% decision threshold. The medicine image requires manual review.",
    Icon: TriangleAlert,
    tone: "text-suspicious bg-amber-50 border-amber-200",
  },
};

export function PredictionResultCard({ result, onCreateReport }: PredictionResultCardProps) {
  const isRejectedImage = result.validation?.status === "rejected";
  const copy = isRejectedImage
    ? {
        title: "Unsupported Image Flagged",
        message: "This upload is not a supported medicine-package photo. It was saved as a Suspicious case for pharmacist review.",
        Icon: TriangleAlert,
        tone: "text-suspicious bg-amber-50 border-amber-200",
      }
    : resultCopy[result.prediction];
  const Icon = copy.Icon;
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className={`border-b p-6 ${copy.tone}`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <span className="grid h-20 w-20 place-items-center rounded-3xl bg-white/70">
              <Icon className="h-11 w-11" />
            </span>
            <div>
              <h3 className="text-3xl font-extrabold tracking-tight">{copy.title}</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6">{copy.message}</p>
            </div>
          </div>
        </div>
        {isRejectedImage ? (
          <div className="grid gap-4 p-6">
            <Alert variant="warning">
              <AlertDescription>
                {result.validation?.message || "Upload a direct, clear photo of consumer medicine packaging."}
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <div className="grid gap-4 p-6 md:grid-cols-3">
            <ScorePanel label="Confidence" value={result.confidence} status={result.prediction} />
            <ScorePanel label="Fake Score" value={result.scores.Fake} status="Fake" />
            <ScorePanel label="Real Score" value={result.scores.Real} status="Real" />
          </div>
        )}
        <div className="grid gap-4 border-t border-border p-6 sm:grid-cols-2">
          <div className="rounded-xl bg-muted p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Model Prediction</p>
            <strong className="mt-1 block text-lg">{isRejectedImage ? "Not analyzed" : result.model_prediction}</strong>
          </div>
          <div className="rounded-xl bg-muted p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">System Decision</p>
            <strong className="mt-1 block text-lg">{result.prediction}</strong>
          </div>
        </div>
        {result.prediction === "Suspicious" && !isRejectedImage && (
          <Alert variant="warning" className="mx-6 mb-6">
            <AlertDescription>Suspicious is confidence-based system logic, not a third trained model class.</AlertDescription>
          </Alert>
        )}
        {isRejectedImage && (
          <Alert variant="warning" className="mx-6 mb-6">
            <AlertDescription>
              This case was added to Suspicious Cases because the upload is outside the supported medicine-packaging domain.
            </AlertDescription>
          </Alert>
        )}
        {result.prediction === "Fake" && onCreateReport && (
          <div className="px-6 pb-6">
            <Button onClick={onCreateReport}>Create Risk Report</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ScorePanel({ label, value, status }: { label: string; value: number; status: "Real" | "Fake" | "Suspicious" }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      <strong className="mt-3 block text-3xl font-extrabold tracking-tight">{formatPercent(value)}</strong>
      <div className="mt-4">
        <ConfidenceProgress value={value} status={status} label="Probability" />
      </div>
    </div>
  );
}
