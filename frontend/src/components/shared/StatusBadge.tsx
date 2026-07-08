import { CheckCircle2, ShieldAlert, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PredictionStatus } from "@/types/domain";

const config = {
  Real: { variant: "real" as const, Icon: CheckCircle2 },
  Fake: { variant: "fake" as const, Icon: ShieldAlert },
  Suspicious: { variant: "suspicious" as const, Icon: TriangleAlert },
};

export function StatusBadge({ status }: { status: PredictionStatus }) {
  const { variant, Icon } = config[status];
  return (
    <Badge variant={variant}>
      <Icon className="h-3.5 w-3.5" />
      {status}
    </Badge>
  );
}
