import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  Gauge,
  RefreshCw,
  ScanLine,
  ShieldAlert,
  ShieldCheck,
  Target,
  TriangleAlert,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { VerificationDonut } from "@/components/dashboard/VerificationDonut";
import { useAuth } from "@/auth/AuthProvider";
import { useScanRecords } from "@/hooks/useRecords";
import { modelFacts } from "@/lib/constants";
import {
  buildMetricTrend,
  buildSparklinePath,
  filterScansByRange,
  getGreeting,
  timeRangeLabels,
  type TimeRange,
} from "@/lib/dashboard-utils";
import { formatPercent } from "@/lib/utils";
import type { PredictionStatus, ScanRecord } from "@/types/domain";

const metricIcons = [ScanLine, CheckCircle2, ShieldAlert, TriangleAlert];

export function DashboardPage() {
  const { user, role } = useAuth();
  const { records: allScans, isLoading } = useScanRecords();
  const [timeRange, setTimeRange] = useState<TimeRange>("today");

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Pharmacist";

  const scans = useMemo(() => filterScansByRange(allScans, timeRange), [allScans, timeRange]);
  const overview = buildOverview(scans);
  const riskCount =
    overview.find((item) => item.name === "Fake")!.value +
    overview.find((item) => item.name === "Suspicious")!.value;

  const dashboardMetrics = [
    {
      label: "Total Scans",
      value: scans.length,
      delta: timeRange === "today" ? "Scans recorded today" : `${timeRangeLabels[timeRange]} activity`,
      tone: "blue" as const,
      trend: buildMetricTrend(allScans, () => true),
    },
    {
      label: "Real Medicines",
      value: overview[0].value,
      delta: `${percentOf(overview[0].value, scans.length)} of period total`,
      tone: "real" as const,
      trend: buildMetricTrend(allScans, (scan) => scan.result === "Real"),
    },
    {
      label: "Fake Detections",
      value: overview[1].value,
      delta: `${percentOf(overview[1].value, scans.length)} of period total`,
      tone: "fake" as const,
      trend: buildMetricTrend(allScans, (scan) => scan.result === "Fake"),
    },
    {
      label: "Suspicious Cases",
      value: overview[2].value,
      delta: `${percentOf(overview[2].value, scans.length)} of period total`,
      tone: "suspicious" as const,
      trend: buildMetricTrend(allScans, (scan) => scan.result === "Suspicious"),
    },
  ];

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="mx-auto max-w-[1360px] space-y-5">
      <section className="rounded-2xl border border-blue-100/80 bg-white/80 p-5 shadow-[0_18px_55px_rgb(15_38_83_/0.06)] backdrop-blur-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-blue-200 bg-blue-50/80 text-primary">
                {role === "Admin" ? "Admin Panel" : "Pharmacist Dashboard"}
              </Badge>
              <Badge variant="outline" className="border-green-200 bg-green-50/80 text-real">
                Live sync
              </Badge>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-foreground xl:text-[2.35rem]">
              {getGreeting()}, {displayName}
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              {role === "Admin"
                ? "Monitor authentication activity, model performance, and pharmacy operations from one unified control center."
                : "Here's what's happening with your medicine authentication system today."}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {role === "Admin" && (
              <Button asChild variant="outline" className="min-w-[180px]">
                <Link to="/app/users">
                  <UsersRound className="h-4 w-4" />
                  Manage Users
                </Link>
              </Button>
            )}
            <Button
              asChild
              size="default"
              className="min-w-[220px] shadow-[0_14px_32px_rgb(11_124_255_/0.18)]"
            >
              <Link to="/app/authenticate">
                <ScanLine className="h-4 w-4" />
                Authenticate Medicine
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {dashboardMetrics.map((metric, index) => (
          <DashboardMetric
            key={metric.label}
            label={metric.label}
            value={metric.value}
            detail={metric.delta}
            Icon={metricIcons[index]}
            tone={metric.tone}
            trendPath={buildSparklinePath(metric.trend)}
          />
        ))}
      </section>

      <section className="grid items-stretch gap-3 xl:grid-cols-12">
        <div className="xl:col-span-5">
          <VerificationPanel
            overview={overview}
            total={scans.length}
            riskCount={riskCount}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
          />
        </div>
        <div className="xl:col-span-4">
          <ActivityPanel scans={scans.slice(0, 5)} />
        </div>
        <div className="xl:col-span-3">
          <PerformancePanel />
        </div>
      </section>
    </div>
  );
}

function buildOverview(scans: ScanRecord[]): Array<{ name: PredictionStatus; value: number }> {
  return [
    { name: "Real", value: scans.filter((scan) => scan.result === "Real").length },
    { name: "Fake", value: scans.filter((scan) => scan.result === "Fake").length },
    { name: "Suspicious", value: scans.filter((scan) => scan.result === "Suspicious").length },
  ];
}

function percentOf(value: number, total: number): string {
  if (!total) return "0.0%";
  return `${((value / total) * 100).toFixed(1)}%`;
}

function VerificationPanel({
  overview,
  total,
  riskCount,
  timeRange,
  onTimeRangeChange,
}: {
  overview: Array<{ name: PredictionStatus; value: number }>;
  total: number;
  riskCount: number;
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
}) {
  return (
    <Card className="flex h-full flex-col overflow-hidden border-blue-100 bg-white shadow-[0_18px_55px_rgb(15_38_83_/0.07)]">
      <CardHeader className="flex-row items-start justify-between gap-3 p-5 pb-3">
        <div>
          <CardTitle className="text-lg">Verification Overview</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">Classification mix from saved scans.</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              {timeRangeLabels[timeRange]}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {(Object.keys(timeRangeLabels) as TimeRange[]).map((range) => (
              <DropdownMenuItem key={range} onClick={() => onTimeRangeChange(range)}>
                {timeRangeLabels[range]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 p-5 pt-0 lg:grid lg:grid-cols-[0.9fr_1fr] lg:content-start">
        <div className="rounded-xl border border-blue-100 bg-[linear-gradient(135deg,#f8fbff_0%,#ffffff_100%)] p-3">
          <VerificationDonut data={overview} compact />
        </div>
        <div className="flex flex-col gap-2.5">
          {overview.map((item) => (
            <OverviewRow key={item.name} item={item} total={total} />
          ))}
          <div className="mt-auto rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50/90 to-white p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  Review Attention
                </p>
                <strong className="mt-1 block text-2xl font-black tracking-tight text-foreground">
                  {riskCount}
                </strong>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  Fake and suspicious results need pharmacist review.
                </p>
              </div>
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-suspicious shadow-sm ring-1 ring-amber-100">
                <Activity className="h-5 w-5" />
              </span>
            </div>
            {riskCount > 0 && (
              <Button asChild variant="outline" size="sm" className="mt-3 w-full border-amber-200 bg-white/80">
                <Link to="/app/history">Review flagged scans</Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityPanel({ scans }: { scans: ScanRecord[] }) {
  return (
    <Card className="flex h-full flex-col overflow-hidden border-blue-100 bg-white shadow-[0_18px_55px_rgb(15_38_83_/0.07)]">
      <CardHeader className="flex-row items-start justify-between gap-3 p-5 pb-3">
        <div>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">Latest authentication decisions.</p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link to="/app/history">View All</Link>
        </Button>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col p-5 pt-0">
        <div className="flex-1 space-y-2.5">
          {scans.length === 0 ? (
            <div className="grid min-h-[240px] flex-1 place-items-center rounded-xl border border-dashed border-blue-200 bg-blue-50/45 p-6 text-center">
              <div>
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white text-primary shadow-sm ring-1 ring-blue-100">
                  <ScanLine className="h-6 w-6" />
                </span>
                <h3 className="mt-4 font-extrabold">No scans yet</h3>
                <p className="mt-1 max-w-[220px] text-sm leading-6 text-muted-foreground">
                  Authenticate a medicine image to start the activity feed.
                </p>
                <Button asChild size="sm" className="mt-4">
                  <Link to="/app/authenticate">Start first scan</Link>
                </Button>
              </div>
            </div>
          ) : (
            scans.map((scan) => <ActivityItem key={scan.id} scan={scan} />)
          )}
        </div>
        <div className="mt-4 flex items-center gap-2 border-t border-blue-50 pt-3 text-xs font-medium text-muted-foreground">
          <RefreshCw className="h-4 w-4 shrink-0" />
          Synced with Supabase records
        </div>
      </CardContent>
    </Card>
  );
}

function PerformancePanel() {
  return (
    <Card className="flex h-full flex-col overflow-hidden border-blue-100 bg-white shadow-[0_18px_55px_rgb(15_38_83_/0.07)]">
      <CardHeader className="p-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">AI Performance</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">Selected model health.</p>
          </div>
          <Badge variant="selected">Active</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col p-5 pt-0">
        <div className="rounded-xl bg-[linear-gradient(135deg,#071a45_0%,#0b7cff_100%)] p-4 text-white shadow-[0_18px_36px_rgb(11_124_255_/0.2)]">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/65">Model</p>
              <h3 className="mt-1 truncate text-lg font-black">{modelFacts.selectedModel}</h3>
              <p className="mt-1.5 text-[11px] font-medium text-white/75">Confidence-based screening enabled</p>
            </div>
            <div className="grid h-[4.75rem] w-[4.75rem] shrink-0 place-items-center rounded-full bg-[conic-gradient(#22c55e_0_337deg,rgba(255,255,255,0.22)_337deg_360deg)] p-1.5">
              <div className="grid h-full w-full place-items-center rounded-full bg-white text-center text-foreground">
                <div>
                  <strong className="block text-sm font-black leading-none text-real">93.54%</strong>
                  <span className="mt-0.5 block text-[9px] font-bold uppercase text-muted-foreground">
                    Accuracy
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-3 space-y-1.5">
          <PerformanceStat Icon={Target} label="Test Accuracy" value={formatPercent(modelFacts.testAccuracy)} tone="real" />
          <PerformanceStat Icon={ShieldCheck} label="Fake Recall" value={formatPercent(modelFacts.fakeRecall, 0)} tone="blue" />
          <PerformanceStat
            Icon={Gauge}
            label="Suspicious Threshold"
            value={formatPercent(modelFacts.suspiciousThreshold, 0)}
            tone="suspicious"
          />
        </div>
        <Button asChild variant="outline" className="mt-auto w-full pt-4">
          <Link to="/app/models">
            <BarChart3 className="h-4 w-4" />
            View Model Details
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function DashboardMetric({
  label,
  value,
  detail,
  Icon,
  tone,
  trendPath,
}: {
  label: string;
  value: number;
  detail: string;
  Icon: LucideIcon;
  tone: "blue" | "real" | "fake" | "suspicious";
  trendPath: string;
}) {
  const toneClasses = {
    blue: { box: "bg-blue-50 text-primary", stroke: "#0b7cff", text: "text-primary" },
    real: { box: "bg-green-50 text-real", stroke: "#22c55e", text: "text-real" },
    fake: { box: "bg-red-50 text-fake", stroke: "#f43f46", text: "text-fake" },
    suspicious: { box: "bg-amber-50 text-suspicious", stroke: "#f59e0b", text: "text-suspicious" },
  }[tone];

  return (
    <Card className="group overflow-hidden border-blue-100 bg-white/95 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgb(15_38_83_/0.08)]">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${toneClasses.box}`}>
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{label}</p>
            <strong className="mt-0.5 block text-2xl font-black tracking-tight">{formatCount(value)}</strong>
            <small className={`mt-0.5 block truncate text-xs font-semibold ${toneClasses.text}`}>{detail}</small>
          </div>
        </div>
        <svg viewBox="0 0 200 54" className="mt-3 h-9 w-full overflow-visible opacity-80" aria-hidden="true">
          <path
            d={trendPath}
            fill="none"
            stroke={toneClasses.stroke}
            strokeLinecap="round"
            strokeWidth="2.5"
            className="transition group-hover:opacity-100"
          />
        </svg>
      </CardContent>
    </Card>
  );
}

function OverviewRow({ item, total }: { item: { name: PredictionStatus; value: number }; total: number }) {
  const percent = total ? item.value / total : 0;
  const color = item.name === "Real" ? "bg-real" : item.name === "Fake" ? "bg-fake" : "bg-suspicious";
  const label =
    item.name === "Real" ? "Real Medicines" : item.name === "Fake" ? "Fake Detections" : "Suspicious Cases";

  return (
    <div className="rounded-xl border border-blue-100 bg-white px-3 py-2.5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2 text-xs font-semibold">
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${color}`} />
          <span className="truncate">{label}</span>
        </span>
        <strong className="shrink-0 text-sm">
          {item.value}{" "}
          <span className="text-xs font-semibold text-muted-foreground">({(percent * 100).toFixed(1)}%)</span>
        </strong>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-blue-50">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.max(3, percent * 100)}%` }} />
      </div>
    </div>
  );
}

function ActivityItem({ scan }: { scan: ScanRecord }) {
  const tone =
    scan.result === "Real"
      ? "border-green-100 bg-green-50/40"
      : scan.result === "Fake"
        ? "border-red-100 bg-red-50/40"
        : "border-amber-100 bg-amber-50/40";

  return (
    <div className={`rounded-xl border p-3 ${tone}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold">{scan.medicine}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {scan.id} · {compactDate(scan.dateTime)}
          </p>
        </div>
        <StatusBadge status={scan.result} />
      </div>
    </div>
  );
}

function PerformanceStat({
  Icon,
  label,
  value,
  tone,
}: {
  Icon: LucideIcon;
  label: string;
  value: string;
  tone: "blue" | "real" | "suspicious";
}) {
  const toneClass =
    tone === "real" ? "bg-green-50 text-real" : tone === "suspicious" ? "bg-amber-50 text-suspicious" : "bg-blue-50 text-primary";

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-blue-100 bg-white px-2.5 py-2">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-md ${toneClass}`}>
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span className="truncate text-xs text-muted-foreground">{label}</span>
      </div>
      <strong className="shrink-0 text-sm font-bold">{value}</strong>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-[1360px] space-y-5">
      <Skeleton className="h-36 w-full rounded-2xl" />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-32 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-3 xl:grid-cols-12">
        <Skeleton className="h-[420px] xl:col-span-5" />
        <Skeleton className="h-[420px] xl:col-span-4" />
        <Skeleton className="h-[420px] xl:col-span-3" />
      </div>
    </div>
  );
}

function formatCount(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function compactDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
