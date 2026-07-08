import { Badge } from "@/components/ui/badge";
import type { RiskStatus } from "@/types/domain";

export function RiskStatusBadge({ status }: { status: RiskStatus }) {
  const variant = status === "Resolved" ? "real" : status === "Under Review" ? "suspicious" : "fake";
  return <Badge variant={variant}>{status}</Badge>;
}
