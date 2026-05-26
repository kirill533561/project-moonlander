"use client";

import { BottomNav } from "@/components/layout/bottom-nav";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Header, DemoProvider } from "@/components/layout/header";
import { ShootingStar } from "@/components/layout/shooting-star";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <DemoProvider>
      <div className="min-h-screen bg-space-dark relative">
        <div className="star-field" />
        <div className="pixel-sparkle pixel-sparkle-1" />
        <div className="pixel-sparkle pixel-sparkle-2" />
        <div className="pixel-sparkle pixel-sparkle-3" />
        <div className="pixel-sparkle pixel-sparkle-4" />
        <div className="pixel-sparkle pixel-sparkle-5" />
        <div className="pixel-sparkle pixel-sparkle-6" />
        <ShootingStar />
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
