import { Outlet } from "react-router-dom";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";

export function AppShell() {
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="fixed inset-y-0 left-0 hidden w-[252px] lg:block">
        <AppSidebar />
      </div>
      <div className="lg:pl-[252px]">
        <AppHeader />
        <main className="mx-auto max-w-[1500px] px-4 py-6 lg:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
