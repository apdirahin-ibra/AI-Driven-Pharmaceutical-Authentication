import type { LucideIcon } from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface MetricCardProps {
  label: string;
  value: number | string;
  detail: string;
  Icon: LucideIcon;
  tone?: "blue" | "real" | "fake" | "suspicious";
}

const tones = {
  blue: "bg-blue-50 text-primary",
  real: "bg-green-50 text-real",
  fake: "bg-red-50 text-fake",
  suspicious: "bg-amber-50 text-suspicious",
};

export function MetricCard({ label, value, detail, Icon, tone = "blue" }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <span className={cn("grid h-14 w-14 place-items-center rounded-2xl", tones[tone])}>
            <Icon className="h-7 w-7" />
          </span>
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <strong className="mt-1 block text-3xl font-extrabold tracking-tight">{typeof value === "number" ? formatNumber(value) : value}</strong>
            <small className="mt-2 block text-sm text-muted-foreground">{detail}</small>
          </div>
        </div>
        <div className="mt-5 h-10 rounded-xl bg-gradient-to-r from-blue-50 via-white to-blue-50" />
      </CardContent>
    </Card>
  );
}
