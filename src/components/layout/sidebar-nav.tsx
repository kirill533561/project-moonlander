"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Mission Control", icon: "🚀" },
  { href: "/finance", label: "Finance Log", icon: "💰" },
  { href: "/goals", label: "Mission Goals", icon: "🎯" },
  { href: "/planner", label: "Mission Planner", icon: "📋" },
  { href: "/trophies", label: "Trophy Case", icon: "🏆" },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-56 min-h-screen bg-space-deeper border-r-2 border-[#2a2a4a] p-4 gap-2 fixed left-0 top-0 z-40">
      <div className="mb-6 px-2">
        <h1 className="font-pixel text-xs text-pixel-cyan leading-relaxed">
          PROJECT
          <br />
          MOONLANDER
        </h1>
        <p className="font-pixel-body text-base text-pixel-purple mt-1">v1.0</p>
      </div>

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-3 font-pixel-body text-lg transition-all ${
                active
                  ? "bg-[#1a1a3a] text-pixel-cyan border-l-2 border-pixel-cyan"
                  : "text-gray-500 hover:text-gray-300 hover:bg-[#1a1a3a]/50 border-l-2 border-transparent"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
