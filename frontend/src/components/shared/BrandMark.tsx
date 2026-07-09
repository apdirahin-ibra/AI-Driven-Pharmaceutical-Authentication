import { ShieldPlus } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandMarkProps {
  compact?: boolean;
  className?: string;
}

export function BrandMark({ compact = false, className }: BrandMarkProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="grid h-9 w-9 place-items-center rounded-xl border border-blue-200 bg-blue-50 text-primary shadow-sm">
        <ShieldPlus className="h-5 w-5" />
      </span>
      {!compact && (
        <span className="text-lg font-extrabold tracking-tight text-foreground">
          PharmaGuard <span className="text-primary">AI</span>
        </span>
      )}
    </div>
  );
}
