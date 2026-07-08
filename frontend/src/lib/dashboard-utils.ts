import type { ScanRecord } from "@/types/domain";

export type TimeRange = "today" | "week" | "all";

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function filterScansByRange(scans: ScanRecord[], range: TimeRange): ScanRecord[] {
  if (range === "all") return scans;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (range === "week") start.setDate(start.getDate() - 6);
  return scans.filter((scan) => new Date(scan.dateTime) >= start);
}

export function buildSparklinePath(values: number[]): string {
  if (!values.some((value) => value > 0)) {
    return "M2 40 C40 38 60 36 80 38 C100 40 120 36 140 38 C160 40 180 38 198 40";
  }

  const max = Math.max(...values, 1);
  const step = 196 / Math.max(values.length - 1, 1);
  return values
    .map((value, index) => {
      const x = 2 + index * step;
      const y = 46 - (value / max) * 34;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

export function buildMetricTrend(
  scans: ScanRecord[],
  predicate: (scan: ScanRecord) => boolean,
  buckets = 12,
): number[] {
  const counts = Array.from({ length: buckets }, () => 0);
  const now = new Date();
  now.setHours(23, 59, 59, 999);

  scans.filter(predicate).forEach((scan) => {
    const dayDiff = Math.floor((now.getTime() - new Date(scan.dateTime).getTime()) / 86_400_000);
    if (dayDiff >= 0 && dayDiff < buckets) counts[buckets - 1 - dayDiff] += 1;
  });

  return counts;
}

export const timeRangeLabels: Record<TimeRange, string> = {
  today: "Today",
  week: "Last 7 days",
  all: "All time",
};
