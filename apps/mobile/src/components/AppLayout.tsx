import type { ReactNode } from "react";
import BottomNav from "./BottomNav";
import SideNav from "./SideNav";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-[#0f172a] selection:bg-emerald-500/20 font-body">
      {/* Sidebar — visible on wide screens only */}
      <div className="hidden md:block w-64 flex-shrink-0">
        <SideNav />
      </div>

      {/* Main content */}
      <main className="flex-1 min-w-0 pb-20 md:pb-0 relative">{children}</main>

      {/* Bottom nav — visible on narrow screens only */}
      <div className="block md:hidden fixed bottom-0 left-0 right-0 z-[100]">
        <BottomNav />
      </div>
    </div>
  );
}
