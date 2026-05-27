"use client";

import { BottomNav } from "@/components/layout/bottom-nav";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Header, DemoProvider, useZoom } from "@/components/layout/header";
import { ShootingStar } from "@/components/layout/shooting-star";
import { MoonEasterEgg } from "@/components/layout/moon-easter-egg";

function ZoomManager() {
  const { zoom } = useZoom();
  if (typeof document === "undefined") return null;
  document.documentElement.style.setProperty("--app-zoom", String(zoom / 100));
  return null;
}

function ZoomedMain({ children }: { children: React.ReactNode }) {
  const { zoom } = useZoom();
  return (
    <main
      className="flex-1 p-5 pb-24 md:pb-6 origin-top-left"
      style={zoom !== 100 ? { zoom: zoom / 100 } : undefined}
    >
      {children}
    </main>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <DemoProvider>
      <ZoomManager />
      <div className="min-h-screen bg-space-dark relative">
        <div className="star-field" />
        <div className="pixel-sparkle pixel-sparkle-1" />
        <div className="pixel-sparkle pixel-sparkle-2" />
        <div className="pixel-sparkle pixel-sparkle-3" />
        <div className="pixel-sparkle pixel-sparkle-4" />
        <div className="pixel-sparkle pixel-sparkle-5" />
        <div className="pixel-sparkle pixel-sparkle-6" />
        <div className="pixel-rocket" />
        <MoonEasterEgg />
        <ShootingStar />
        <SidebarNav />
        <div className="md:ml-56 flex flex-col min-h-screen relative z-10">
          <Header />
          <ZoomedMain>{children}</ZoomedMain>
        </div>
        <BottomNav />
      </div>
    </DemoProvider>
  );
}
