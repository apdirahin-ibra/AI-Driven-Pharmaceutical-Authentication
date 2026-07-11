import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  Icon: LucideIcon;
  title: string;
  description: string;
}

export function EmptyState({ Icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-blue-200 bg-blue-50/20 p-8 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-2xl bg-blue-50 text-primary">
          <Icon className="h-8 w-8" />
        </span>
        <h3 className="mt-5 text-xl font-bold">{title}</h3>
        <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}
