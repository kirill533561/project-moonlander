"use client";

import { BottomNav } from "@/components/layout/bottom-nav";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Header, DemoProvider } from "@/components/layout/header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <DemoProvider>
      <div className="min-h-screen bg-space-dark relative">
        <div className="star-field" />
        <SidebarNav />
        <div className="md:ml-56 flex flex-col min-h-screen relative z-10">
          <Header />
          <main className="flex-1 p-5 pb-24 md:pb-6">{children}</main>
        </div>
        <BottomNav />
      </div>
    </DemoProvider>
  );
}
