import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowRight, BarChart3, CheckCircle2, FileText, ScanLine, ShieldAlert, TriangleAlert, UsersRound, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { MedicineScanImage } from "@/components/shared/MedicineScanImage";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useAuth } from "@/auth/AuthProvider";
import { useRiskReports, useScanRecords } from "@/hooks/useRecords";
import { modelFacts } from "@/lib/constants";
import { filterScansByRange, getGreeting, type TimeRange } from "@/lib/dashboard-utils";
import { formatDateTime, formatNumber, formatPercent } from "@/lib/utils";
import type { RiskReport, ScanRecord } from "@/types/domain";

export function DashboardPage() {
  const { user, role } = useAuth();
  const { records: allScans, isLoading: scansLoading } = useScanRecords();
  const { records: reports, isLoading: reportsLoading } = useRiskReports();
  const [timeRange, setTimeRange] = useState<TimeRange>("week");

  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || role;
  const scans = useMemo(() => filterScansByRange(allScans, timeRange), [allScans, timeRange]);
  const unresolved = useMemo(() => reports.filter((report) => report.status !== "Resolved"), [reports]);
  const trend = useMemo(() => buildDailyTrend(allScans, timeRange === "all" ? 30 : 7), [allScans, timeRange]);

  if (scansLoading || reportsLoading) return <DashboardSkeleton />;

  const genuine = scans.filter((scan) => scan.result === "Real").length;
  const fake = scans.filter((scan) => scan.result === "Fake").length;
  const flagged = scans.length - genuine;
  const metrics = role === "Admin"
    ? [
        { label: "Total Scans", value: scans.length, detail: rangeLabel(timeRange), Icon: ScanLine, tone: "blue" as const },
        { label: "Genuine", value: genuine, detail: percentOf(genuine, scans.length), Icon: CheckCircle2, tone: "real" as const },
        { label: "Fake", value: fake, detail: percentOf(fake, scans.length), Icon: ShieldAlert, tone: "fake" as const },
        { label: "Needs Review", value: unresolved.length, detail: "Open and under review", Icon: TriangleAlert, tone: "warning" as const },
      ]
    : [
        { label: "My Scans", value: scans.length, detail: rangeLabel(timeRange), Icon: ScanLine, tone: "blue" as const },
        { label: "Genuine Results", value: genuine, detail: percentOf(genuine, scans.length), Icon: CheckCircle2, tone: "real" as const },
        { label: "Fake / Suspicious", value: flagged, detail: percentOf(flagged, scans.length), Icon: ShieldAlert, tone: "fake" as const },
        { label: "Needs My Attention", value: unresolved.length, detail: "Unresolved reports", Icon: TriangleAlert, tone: "warning" as const },
      ];

  return (
    <div className="mx-auto max-w-[1360px] space-y-4">
      <header className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Badge variant="outline" className="mb-2 border-blue-200 bg-blue-50 text-primary">{role} dashboard</Badge>
          <h1 className="text-2xl font-black tracking-tight md:text-3xl">{getGreeting()}, {displayName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {role === "Admin" ? "Monitor authentication and pharmacy operations." : "Authenticate medicines and track your recent scan work."}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
            <SelectTrigger className="w-full bg-white sm:w-[150px]" aria-label="Dashboard date range"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Last 7 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button asChild><Link to="/app/authenticate"><ScanLine className="h-4 w-4" />Authenticate Medicine<ArrowRight className="h-4 w-4" /></Link></Button>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => <OperationalMetric key={metric.label} {...metric} />)}
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-8">
          <CardHeader className="p-5 pb-2"><CardTitle className="text-base">Authentication Trend</CardTitle><p className="text-xs text-muted-foreground">Daily genuine, fake, and suspicious activity.</p></CardHeader>
          <CardContent className="p-5 pt-2">
            {allScans.length < 2 ? (
              <div className="grid h-[260px] place-items-center rounded-xl border border-dashed border-blue-200 bg-blue-50/30 text-center">
                <div><BarChart3 className="mx-auto h-7 w-7 text-primary" /><p className="mt-2 font-bold">More scan data is needed</p><p className="mt-1 text-sm text-muted-foreground">The trend appears after at least two saved scans.</p></div>
              </div>
            ) : (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend} margin={{ top: 12, right: 8, left: -22, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="#e4edf8" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#607193" }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#607193" }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="genuine" stroke="#22c55e" fill="#dcfce7" strokeWidth={2} />
                    <Area type="monotone" dataKey="fake" stroke="#ef4444" fill="#fee2e2" strokeWidth={2} />
                    <Area type="monotone" dataKey="suspicious" stroke="#f59e0b" fill="#fef3c7" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
        <ReviewQueue reports={unresolved.slice(0, 4)} role={role} />
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <RecentScans scans={allScans.slice(0, 6)} role={role} />
        <div className="space-y-4 xl:col-span-4">
          <ModelHealth />
          {role === "Admin" && <QuickActions />}
        </div>
      </section>
    </div>
  );
}

function OperationalMetric({ label, value, detail, Icon, tone }: { label: string; value: number; detail: string; Icon: LucideIcon; tone: "blue" | "real" | "fake" | "warning" }) {
  const tones = { blue: "bg-blue-50 text-primary", real: "bg-green-50 text-real", fake: "bg-red-50 text-fake", warning: "bg-amber-50 text-suspicious" };
  return <Card className="shadow-sm"><CardContent className="flex items-center gap-3 p-4"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tones[tone]}`}><Icon className="h-5 w-5" /></span><div className="min-w-0"><p className="text-xs font-semibold text-muted-foreground">{label}</p><strong className="block text-2xl font-black leading-tight">{formatNumber(value)}</strong><span className="block truncate text-xs text-muted-foreground">{detail}</span></div></CardContent></Card>;
}

function ReviewQueue({ reports, role }: { reports: RiskReport[]; role: "Admin" | "Pharmacist" }) {
  return <Card className="xl:col-span-4"><CardHeader className="flex-row items-start justify-between p-5 pb-3"><div><CardTitle className="text-base">{role === "Admin" ? "Urgent Review Queue" : "Needs My Attention"}</CardTitle><p className="mt-1 text-xs text-muted-foreground">Highest-priority unresolved cases.</p></div><Button asChild variant="ghost" size="sm"><Link to="/app/reports">View all</Link></Button></CardHeader><CardContent className="space-y-2 p-5 pt-0">{reports.length ? reports.map((report) => <Link key={report.id} to="/app/reports" className="flex items-center gap-3 rounded-xl border border-border p-2.5 hover:bg-muted"><MedicineScanImage scanId={report.scanId} hasImage={report.hasImage} alt={`${report.medicine} uploaded package`} className="h-11 w-11 shrink-0 border border-border" /><div className="min-w-0 flex-1"><strong className="block truncate text-sm">{report.id}</strong><span className="block truncate text-xs text-muted-foreground">{report.pharmacist} · {formatDateTime(report.createdAt || report.scanDate)}</span></div><div className="text-right"><StatusBadge status={report.aiResult} /><span className="mt-1 block text-xs font-bold">{formatPercent(report.confidence)}</span></div></Link>) : <div className="grid min-h-[190px] place-items-center rounded-xl border border-dashed border-green-200 bg-green-50/30 text-center"><div><CheckCircle2 className="mx-auto h-7 w-7 text-real" /><p className="mt-2 text-sm font-bold">No unresolved cases</p></div></div>}</CardContent></Card>;
}

function RecentScans({ scans, role }: { scans: ScanRecord[]; role: "Admin" | "Pharmacist" }) {
  return <Card className="xl:col-span-8"><CardHeader className="flex-row items-start justify-between p-5 pb-3"><div><CardTitle className="text-base">{role === "Admin" ? "Recent Scans" : "My Recent Scans"}</CardTitle><p className="mt-1 text-xs text-muted-foreground">Latest authentication records.</p></div><Button asChild variant="ghost" size="sm"><Link to="/app/history">View history</Link></Button></CardHeader><CardContent className="p-5 pt-0">{scans.length ? <div className="divide-y divide-border">{scans.map((scan) => <div key={scan.id} className="grid items-center gap-3 py-3 md:grid-cols-[minmax(210px,1.5fr)_100px_90px_minmax(120px,1fr)_130px]"><div className="flex min-w-0 items-center gap-3"><MedicineScanImage scanId={scan.id} hasImage={scan.hasImage} alt={`${scan.medicine} uploaded package`} className="h-11 w-11 shrink-0 border border-border" /><div className="min-w-0"><strong className="block truncate text-sm">{scan.medicine}</strong><span className="text-xs font-semibold text-primary">{scan.id}</span></div></div><StatusBadge status={scan.result} /><span className="text-sm font-bold">{formatPercent(scan.confidence)}</span><span className="truncate text-sm text-muted-foreground">{scan.pharmacist}</span><span className="text-xs text-muted-foreground">{formatDateTime(scan.createdAt || scan.dateTime)}</span></div>)}</div> : <p className="py-10 text-center text-sm text-muted-foreground">No scans have been saved yet.</p>}</CardContent></Card>;
}

function ModelHealth() {
  return <Card><CardHeader className="flex-row items-start justify-between p-5 pb-3"><div><CardTitle className="text-base">AI Model Health</CardTitle><p className="mt-1 text-xs text-muted-foreground">Current production evaluation.</p></div><Badge variant="selected">Active</Badge></CardHeader><CardContent className="space-y-3 p-5 pt-0"><div><p className="text-xs text-muted-foreground">Production model</p><strong className="text-lg">{modelFacts.selectedModel}</strong></div><div className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border pt-3"><HealthValue label="Accuracy" value={formatPercent(modelFacts.testAccuracy, 2)} /><HealthValue label="Fake recall" value={formatPercent(modelFacts.fakeRecall, 2)} /><HealthValue label="Artifact" value={modelFacts.modelFile} /><HealthValue label="Input" value={modelFacts.inputSize} /></div><Button asChild variant="outline" className="w-full"><Link to="/app/models">View model performance</Link></Button></CardContent></Card>;
}

function HealthValue({ label, value }: { label: string; value: string }) { return <div className="min-w-0"><span className="block text-xs text-muted-foreground">{label}</span><strong className="block truncate text-sm" title={value}>{value}</strong></div>; }

function QuickActions() { return <Card><CardHeader className="p-5 pb-3"><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader><CardContent className="grid gap-2 p-5 pt-0"><QuickLink to="/app/reports" Icon={FileText} label="Review flagged scans" /><QuickLink to="/app/users" Icon={UsersRound} label="Manage users" /><QuickLink to="/app/models" Icon={BarChart3} label="Review AI models" /></CardContent></Card>; }
function QuickLink({ to, Icon, label }: { to: string; Icon: LucideIcon; label: string }) { return <Button asChild variant="outline" className="justify-start"><Link to={to}><Icon className="h-4 w-4" />{label}</Link></Button>; }

function buildDailyTrend(scans: ScanRecord[], days: number) {
  const formatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(); date.setHours(0, 0, 0, 0); date.setDate(date.getDate() - (days - 1 - index));
    const next = new Date(date); next.setDate(next.getDate() + 1);
    const daily = scans.filter((scan) => { const value = new Date(scan.createdAt || scan.dateTime); return value >= date && value < next; });
    return { label: formatter.format(date), genuine: daily.filter((scan) => scan.result === "Real").length, fake: daily.filter((scan) => scan.result === "Fake").length, suspicious: daily.filter((scan) => scan.result === "Suspicious").length };
  });
}

function percentOf(value: number, total: number) { return total ? `${((value / total) * 100).toFixed(1)}% of scans` : "0% of scans"; }
function rangeLabel(range: TimeRange) { return range === "today" ? "Today" : range === "week" ? "Last 7 days" : "All time"; }

function DashboardSkeleton() { return <div className="space-y-4"><Skeleton className="h-24" /><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-24" />)}</div><div className="grid gap-4 xl:grid-cols-12"><Skeleton className="h-[360px] xl:col-span-8" /><Skeleton className="h-[360px] xl:col-span-4" /></div></div>; }
