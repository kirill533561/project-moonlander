"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Mission", icon: "🚀" },
  { href: "/finance", label: "Finance", icon: "💰" },
  { href: "/goals", label: "Goals", icon: "🎯" },
  { href: "/stocks", label: "Stocks", icon: "📊" },
  { href: "/trophies", label: "Trophies", icon: "🏆" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-space-deeper border-t-2 border-[#2a2a4a] md:hidden">
      <div className="flex items-center justify-around h-16">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 min-w-[60px] py-2 transition-colors ${
                active ? "text-pixel-cyan" : "text-gray-500"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-pixel text-[8px] leading-none">{item.label}</span>
              {active && (
                <div className="absolute bottom-0 h-[2px] w-10 bg-pixel-cyan" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
