import { ShieldPlus } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandMarkProps {
  compact?: boolean;
  className?: string;
}

export function BrandMark({ compact = false, className }: BrandMarkProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="grid h-10 w-10 place-items-center rounded-xl border border-blue-200 bg-blue-50 text-primary shadow-sm">
        <ShieldPlus className="h-6 w-6" />
      </span>
      {!compact && (
        <span className="text-xl font-extrabold tracking-tight text-foreground">
          PharmaGuard <span className="text-primary">AI</span>
        </span>
      )}
    </div>
  );
}
