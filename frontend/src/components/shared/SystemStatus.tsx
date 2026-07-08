import { CircleCheck } from "lucide-react";

export function SystemStatus() {
  return (
    <div className="inline-flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-2 shadow-sm">
      <span className="relative grid h-8 w-8 place-items-center rounded-full bg-green-50 text-real">
        <span className="absolute inset-0 rounded-full bg-real/20 animate-ping" />
        <CircleCheck className="relative h-4 w-4" />
      </span>
      <span className="leading-tight">
        <strong className="block text-sm">AI System Online</strong>
        <small className="text-muted-foreground">System operational status</small>
      </span>
    </div>
  );
}
