import { Progress } from "@/components/ui/progress";
import { cn, formatPercent } from "@/lib/utils";
import type { PredictionStatus } from "@/types/domain";

interface ConfidenceProgressProps {
  value: number;
  status?: PredictionStatus;
  label?: string;
}

export function ConfidenceProgress({ value, status, label }: ConfidenceProgressProps) {
  const colorClass = status === "Fake" ? "[&>div]:bg-fake" : status === "Suspicious" ? "[&>div]:bg-suspicious" : "[&>div]:bg-real";
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
        <span>{label || "Confidence"}</span>
        <span>{formatPercent(value)}</span>
      </div>
      <Progress value={Math.min(100, Math.max(0, value * 100))} className={cn("h-2", colorClass)} />
    </div>
  );
}
