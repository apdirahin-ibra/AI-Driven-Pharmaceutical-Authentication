import { Brain, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { analysisStages } from "@/hooks/useAnalysisProgress";
import { cn } from "@/lib/utils";

interface AnalysisProgressPanelProps {
  progress: number;
  label: string;
  stageIndex: number;
}

export function AnalysisProgressPanel({ progress, label, stageIndex }: AnalysisProgressPanelProps) {
  const isComplete = progress >= 100;

  return (
    <div className="rounded-2xl border border-blue-200 bg-[linear-gradient(180deg,#f8fbff_0%,#eef6ff_100%)] p-6 sm:p-8">
      <div className="mx-auto flex max-w-md flex-col items-center text-center">
        <div className="relative grid h-36 w-36 place-items-center">
          <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
            <circle cx="60" cy="60" r="52" fill="none" stroke="rgb(219 234 254)" strokeWidth="10" />
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="url(#analysisProgressGradient)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${(progress / 100) * 326.73} 326.73`}
              className="transition-[stroke-dasharray] duration-300 ease-out"
            />
            <defs>
              <linearGradient id="analysisProgressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0b7cff" />
                <stop offset="100%" stopColor="#22c55e" />
              </linearGradient>
            </defs>
          </svg>
          <div className="relative z-10">
            {isComplete ? (
              <CheckCircle2 className="mx-auto h-10 w-10 text-real" />
            ) : (
              <Brain className="spinner mx-auto h-10 w-10 text-primary" />
            )}
            <strong className="mt-2 block text-3xl font-black tracking-tight text-foreground">{progress}%</strong>
          </div>
        </div>

        <h3 className="mt-5 text-2xl font-black tracking-tight text-foreground">{label}</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {isComplete
            ? "Finalizing your authentication result."
            : "AI is inspecting packaging patterns, label quality, and confidence signals."}
        </p>

        <div className="mt-6 w-full space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2.5 [&>div]:bg-[linear-gradient(90deg,#0b7cff_0%,#22c55e_100%)]" />
        </div>

        <div className="mt-6 grid w-full gap-2 sm:grid-cols-4">
          {analysisStages.slice(0, 4).map((stage, index) => {
            const isDone = stageIndex > index || isComplete;
            const isActive = stageIndex === index && !isComplete;

            return (
              <div
                key={stage.label}
                className={cn(
                  "rounded-xl border px-2 py-2.5 text-center transition",
                  isDone && "border-green-200 bg-green-50/80",
                  isActive && "border-blue-300 bg-white shadow-sm ring-1 ring-blue-100",
                  !isDone && !isActive && "border-blue-100 bg-white/70",
                )}
              >
                <span
                  className={cn(
                    "mx-auto mb-1.5 grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold",
                    isDone && "bg-real text-white",
                    isActive && "bg-primary text-primary-foreground",
                    !isDone && !isActive && "bg-blue-100 text-muted-foreground",
                  )}
                >
                  {isDone ? "✓" : index + 1}
                </span>
                <p className="text-[10px] font-semibold leading-4 text-muted-foreground">{stage.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
