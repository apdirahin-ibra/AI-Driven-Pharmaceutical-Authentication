import { Brain, FileCode2, Gauge, LineChart, ShieldCheck, Sparkles, Target, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { modelFacts } from "@/lib/constants";
import { formatPercent } from "@/lib/utils";

const accuracyPercent = (modelFacts.testAccuracy * 100).toFixed(1);
const circumference = 2 * Math.PI * 54;
const dashOffset = circumference - (modelFacts.testAccuracy * circumference);

export function SelectedModelHero() {
  return (
    <Card className="relative overflow-hidden rounded-[28px] border-0 bg-[linear-gradient(135deg,#243bb7_0%,#1677ff_46%,#7447f6_100%)] text-white shadow-[0_24px_64px_rgb(20_55_140_/0.24)] animate-fade-in-up">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_86%_24%,rgb(255_255_255_/0.18),transparent_18rem),radial-gradient(circle_at_6%_96%,rgb(56_189_248_/0.22),transparent_18rem)]" />
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(130deg,transparent_0%,rgb(255_255_255_/0.10)_48%,transparent_70%)]" />
      <div className="absolute right-8 top-10 hidden h-32 w-32 rounded-full border border-white/10 md:block" />
      <Brain className="absolute right-14 top-16 hidden h-24 w-24 text-white/14 md:block" />

      <CardContent className="relative p-6 md:p-7">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-[29rem]">
            <div className="inline-flex flex-wrap items-center gap-2.5">
              <Badge className="gap-1.5 rounded-xl border border-white/20 bg-white px-3.5 py-2 text-[11px] font-black text-primary shadow-[0_12px_28px_rgb(6_18_56_/0.12)]">
                <Sparkles className="h-3 w-3" />
                Production Model
              </Badge>
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-100 px-3 py-2 text-[11px] font-black text-emerald-700 shadow-[0_10px_24px_rgb(6_18_56_/0.08)] ring-1 ring-white/30">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Active
              </span>
            </div>
            <h2 className="mt-7 text-3xl font-black tracking-tight text-white drop-shadow-[0_2px_18px_rgb(6_18_56_/0.22)] md:text-[2.45rem]">
              {modelFacts.selectedModel}
            </h2>
            <p className="mt-4 max-w-[28rem] text-sm font-semibold leading-6 text-blue-50/95">
              Improved CNN delivering <strong className="font-black text-white">the strongest overall accuracy</strong> and highest fake-medicine recall among all evaluated architectures.
            </p>
          </div>

          <div className="relative mx-auto shrink-0 md:mx-0 md:mt-16">
            <div className="absolute inset-0 rounded-full bg-cyan-300/20 blur-xl" />
            <svg width="150" height="150" viewBox="0 0 128 128" className="relative drop-shadow-[0_16px_30px_rgb(6_18_56_/0.20)]">
              <defs>
                <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6ee7b7" />
                  <stop offset="52%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#4f46e5" />
                </linearGradient>
              </defs>
              <circle cx="64" cy="64" r="54" fill="rgb(255 255 255 / 0.06)" stroke="rgb(255 255 255 / 0.20)" strokeWidth="8" />
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
              <text x="64" y="59" textAnchor="middle" className="fill-white text-[21px] font-black">{accuracyPercent}%</text>
              <text x="64" y="78" textAnchor="middle" className="fill-blue-50 text-[9px] font-black uppercase tracking-[0.12em]">Accuracy</text>
            </svg>
          </div>
        </div>

        <div className="mt-12 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <HeroMetric icon={Target} label="Test Accuracy" value={formatPercent(modelFacts.testAccuracy)} tone="real" />
          <HeroMetric icon={ShieldCheck} label="Fake Recall" value={formatPercent(modelFacts.fakeRecall, 0)} tone="blue" />
          <HeroMetric icon={Gauge} label="Suspicious Threshold" value={formatPercent(modelFacts.suspiciousThreshold, 0)} tone="amber" />
          <HeroMetric icon={LineChart} label="Test Loss" value={modelFacts.testLoss.toString()} tone="blue" />
          <HeroMetric icon={Zap} label="Input Size" value={modelFacts.inputSize} tone="purple" />
          <HeroMetric icon={FileCode2} label="Model File" value={modelFacts.modelFile} tone="neutral" />
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
    real: "text-emerald-700",
    blue: "text-primary",
    amber: "text-amber-700",
    neutral: "text-slate-600",
    purple: "text-violet-700",
  };

  return (
    <div className={`hover-lift min-h-[92px] rounded-2xl border border-white/70 bg-white/94 p-4 shadow-[0_14px_34px_rgb(6_18_56_/0.13)] backdrop-blur transition-all duration-300 ${className}`}>
      <div className="flex items-start gap-3">
        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-blue-50 ${toneStyles[tone]}`}>
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className={`text-[10px] font-black uppercase leading-4 tracking-[0.13em] ${toneStyles[tone]}`}>{label}</p>
          <strong className="mt-1 block truncate text-lg font-black text-foreground">{value}</strong>
        </div>
      </div>
    </div>
  );
}
