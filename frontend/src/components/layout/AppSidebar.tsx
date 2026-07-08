import { NavLink } from "react-router-dom";
import { BarChart3, FileClock, FileText, LayoutDashboard, ScanLine, ShieldCheck, UsersRound } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/auth/AuthProvider";
import { BrandMark } from "@/components/shared/BrandMark";
import { cn } from "@/lib/utils";

export function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user, role } = useAuth();
  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "PharmaGuard User";
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part: string) => part[0]?.toUpperCase())
    .join("") || "PG";
  const groups = [
    { label: "Overview", items: [{ label: "Dashboard", href: "/app/dashboard", Icon: LayoutDashboard }] },
    {
      label: "Authentication",
      items: [
        { label: "Authenticate Medicine", href: "/app/authenticate", Icon: ScanLine },
        { label: "Scan History", href: "/app/history", Icon: FileClock },
      ],
    },
    {
      label: "Intelligence",
      items: [
        { label: "AI Models", href: "/app/models", Icon: BarChart3 },
        { label: "Reports", href: "/app/reports", Icon: FileText },
      ],
    },
    ...(role === "Admin" ? [{
      label: "Admin",
      items: [
        { label: "User Management", href: "/app/users", Icon: UsersRound },
      ],
    }] : []),
  ];

  return (
    <aside className="flex h-full flex-col border-r border-border bg-white px-3 py-4">
      <BrandMark className="[&>span:first-child]:h-9 [&>span:first-child]:w-9 [&_svg]:h-5 [&_svg]:w-5 [&>span:last-child]:text-lg" />
      <p className="mt-1 pl-[48px] text-[11px] font-semibold text-muted-foreground">Pharmaceutical Intelligence</p>
      <nav className="mt-7 flex-1 space-y-5">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="mb-2 px-2.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">{group.label}</p>
            <div className="grid gap-1">
              {group.items.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  onClick={onNavigate}
                  className={({ isActive }) => cn("flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-[13px] font-semibold transition", isActive ? "bg-blue-50 text-primary shadow-sm ring-1 ring-blue-100" : "text-[#263a63] hover:bg-muted")}
                >
                  <item.Icon className="h-4.5 w-4.5" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="rounded-xl border border-border bg-blue-50/60 p-3 text-[13px]">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <p className="mt-2 font-semibold">Securing Medicines.</p>
        <p className="text-muted-foreground">Protecting Communities.</p>
        <p className="mt-2 text-[11px] font-bold text-primary">Built for Somali Pharmacies</p>
      </div>
      <Separator className="my-3" />
      <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card p-2.5">
        <Avatar className="h-9 w-9">
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <strong className="block truncate text-[13px]">{displayName}</strong>
          <span className="block truncate text-[11px] text-muted-foreground">{user?.email || "Authenticated user"}</span>
          <span className="mt-0.5 inline-block rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
            {role}
          </span>
        </div>
      </div>
    </aside>
  );
}
