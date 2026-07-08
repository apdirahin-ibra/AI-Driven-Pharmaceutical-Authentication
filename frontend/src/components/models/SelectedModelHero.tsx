import { Brain, Cpu, FileCode2, Gauge, ShieldCheck, Sparkles, Target, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { modelFacts } from "@/lib/constants";
import { formatPercent } from "@/lib/utils";

const accuracyPercent = (modelFacts.testAccuracy * 100).toFixed(2);
const circumference = 2 * Math.PI * 54;
const dashOffset = circumference - (modelFacts.testAccuracy * circumference);

export function SelectedModelHero() {
  return (
    <Card className="glass-card-strong gradient-border relative overflow-hidden rounded-3xl animate-fade-in-up">
      {/* Animated background elements */}
      <div className="absolute inset-0 neural-grid opacity-30" />
      <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgb(99_102_241_/0.12),transparent_70%)] animate-float-slow" />
      <div className="absolute -left-12 bottom-0 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgb(11_124_255_/0.10),transparent_70%)] animate-float" />

      {/* Floating particles */}
      <div className="absolute right-[15%] top-[20%] h-2 w-2 rounded-full bg-primary/30" style={{ animation: "particle-float 5s ease-in-out infinite" }} />
      <div className="absolute right-[30%] top-[60%] h-1.5 w-1.5 rounded-full bg-indigo-400/25" style={{ animation: "particle-float 7s ease-in-out infinite 1s" }} />
      <div className="absolute left-[25%] top-[15%] h-1 w-1 rounded-full bg-violet-400/30" style={{ animation: "particle-float 6s ease-in-out infinite 2s" }} />

      <CardContent className="relative p-6 md:p-8">
        {/* Header with badge and title */}
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-md">
            <div className="inline-flex items-center gap-2">
              <Badge variant="selected" className="gap-1.5 px-3 py-1.5 text-xs shadow-[0_0_16px_rgb(11_124_255_/0.2)]">
                <Sparkles className="h-3 w-3" />
                Production Model
              </Badge>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200/60">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active
              </span>
            </div>
            <h2 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">
              <span className="gradient-text">{modelFacts.selectedModel}</span>
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Improved CNN delivering <strong className="text-foreground">the strongest overall accuracy</strong> and highest fake-medicine recall among all evaluated architectures.
            </p>
          </div>

          {/* Animated accuracy ring */}
          <div className="relative shrink-0">
            <div className="absolute inset-0 rounded-full animate-pulse-ring" style={{ background: "radial-gradient(circle, rgb(11 124 255 / 0.08), transparent 70%)" }} />
            <svg width="128" height="128" viewBox="0 0 128 128" className="drop-shadow-[0_8px_24px_rgb(11_124_255_/0.2)]">
              <defs>
                <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="50%" stopColor="#0b7cff" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
              <circle cx="64" cy="64" r="54" fill="none" stroke="rgb(11 124 255 / 0.1)" strokeWidth="8" />
              <circle
                cx="64" cy="64" r="54"
                fill="none"
                stroke="url(#ringGrad)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                transform="rotate(-90 64 64)"
                style={{ "--circumference": circumference, "--dash-offset": dashOffset, animation: "counter-fill 1.8s cubic-bezier(0.4,0,0.2,1) both" } as React.CSSProperties}
              />
              <text x="64" y="58" textAnchor="middle" className="fill-foreground text-xl font-black">{accuracyPercent}%</text>
              <text x="64" y="76" textAnchor="middle" className="fill-muted-foreground text-[9px] font-bold uppercase tracking-[0.14em]">Accuracy</text>
            </svg>
          </div>
        </div>

        {/* Model visualization + Metrics grid */}
        <div className="mt-8 grid gap-5 lg:grid-cols-[220px_1fr]">
          {/* Neural network icon panel */}
          <div className="relative overflow-hidden rounded-[1.5rem] border border-blue-200/60 bg-gradient-to-br from-[#f0f7ff] via-[#eef6ff] to-[#e8f3ff] p-6">
            <div className="neural-grid absolute inset-0 opacity-50" />
            {/* Orbiting decoration */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-40 w-40 rounded-full animate-orbit opacity-30">
                <div className="h-2.5 w-2.5 rounded-full bg-primary/40" />
              </div>
            </div>
            <div className="relative grid h-full min-h-[180px] place-items-center">
              <div className="animate-float">
                <div className="glow-blue grid h-28 w-28 place-items-center rounded-3xl bg-white/90 ring-1 ring-blue-100/80">
                  <Brain className="h-14 w-14 text-primary drop-shadow-[0_0_8px_rgb(11_124_255_/0.3)]" />
                </div>
              </div>
            </div>
          </div>

          {/* Metrics grid */}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <HeroMetric icon={Target} label="Test Accuracy" value={formatPercent(modelFacts.testAccuracy)} tone="real" />
            <HeroMetric icon={ShieldCheck} label="Fake Recall" value={formatPercent(modelFacts.fakeRecall, 0)} tone="blue" />
            <HeroMetric icon={Gauge} label="Suspicious Threshold" value={formatPercent(modelFacts.suspiciousThreshold, 0)} tone="amber" />
            <HeroMetric icon={Cpu} label="Test Loss" value={modelFacts.testLoss.toString()} tone="neutral" />
            <HeroMetric icon={Zap} label="Input Size" value={modelFacts.inputSize} tone="purple" />
            <HeroMetric icon={FileCode2} label="Model File" value={modelFacts.modelFile} tone="neutral" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function HeroMetric({
  icon: Icon,
  label,
  value,
  tone,
  className = "",
}: {
  icon: typeof Target;
  label: string;
  value: string;
  tone: "real" | "blue" | "amber" | "neutral" | "purple";
  className?: string;
}) {
  const toneStyles = {
    real: "border-emerald-100/80 bg-gradient-to-br from-emerald-50/90 to-white hover:shadow-[0_0_20px_rgb(34_197_94_/0.15)] text-emerald-700",
    blue: "border-blue-100/80 bg-gradient-to-br from-blue-50/90 to-white hover:shadow-[0_0_20px_rgb(11_124_255_/0.15)] text-primary",
    amber: "border-amber-100/80 bg-gradient-to-br from-amber-50/90 to-white hover:shadow-[0_0_20px_rgb(245_158_11_/0.15)] text-amber-700",
    neutral: "border-slate-100/80 bg-gradient-to-br from-slate-50/90 to-white hover:shadow-[0_0_20px_rgb(100_116_139_/0.1)] text-slate-600",
    purple: "border-violet-100/80 bg-gradient-to-br from-violet-50/90 to-white hover:shadow-[0_0_20px_rgb(139_92_246_/0.15)] text-violet-700",
  };

  return (
    <div className={`hover-lift rounded-2xl border p-4 transition-all duration-300 ${toneStyles[tone]} ${className}`}>
      <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em]">
        <Icon className="h-4 w-4 shrink-0" />
        {label}
      </p>
      <strong className="mt-2 block truncate text-lg font-black text-foreground">{value}</strong>
    </div>
  );
}
