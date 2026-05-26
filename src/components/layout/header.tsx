"use client";

import { useEffect, useState, createContext, useContext } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const DemoContext = createContext<{ demoMode: boolean; setDemoMode: (v: boolean) => void }>({
  demoMode: false,
  setDemoMode: () => {},
});

export function useDemoMode() {
  return useContext(DemoContext);
}

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [demoMode, setDemoMode] = useState(false);
  return (
    <DemoContext.Provider value={{ demoMode, setDemoMode }}>
      {children}
    </DemoContext.Provider>
  );
}

export function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const { demoMode, setDemoMode } = useDemoMode();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, [supabase.auth]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (showMenu && !(e.target as HTMLElement).closest("[data-header-menu]")) {
        setShowMenu(false);
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [showMenu]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 bg-space-deeper/90 backdrop-blur border-b-2 border-[#2a2a4a]">
      <div className="md:hidden">
        <span className="font-pixel text-[10px] text-pixel-cyan">MOONLANDER</span>
      </div>

      <div className="flex items-center gap-3 ml-auto relative" data-header-menu>
        {demoMode && (
          <span className="font-pixel text-[8px] text-pixel-gold animate-glow">DEMO</span>
        )}
        {user && (
          <>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2"
            >
              {user.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt=""
                  className="w-9 h-9 border-2 border-pixel-cyan cursor-pointer hover:border-pixel-gold transition-colors"
                />
              ) : (
                <div className="w-9 h-9 border-2 border-pixel-cyan bg-[#1a1a3a] flex items-center justify-center font-pixel-body text-lg text-pixel-cyan">
                  {(user.email || "?")[0].toUpperCase()}
                </div>
              )}
            </button>

            {showMenu && (
              <div className="absolute top-full right-0 mt-2 pixel-card p-3 flex flex-col gap-2 min-w-[200px] z-50">
                <p className="font-pixel-body text-base text-gray-400 truncate">
                  {user.user_metadata?.full_name || user.email}
                </p>
                <hr className="border-[#2a2a4a]" />
                <button
                  onClick={() => { setDemoMode(!demoMode); setShowMenu(false); }}
                  className={`font-pixel-body text-lg text-left py-1 ${demoMode ? "text-pixel-gold" : "text-gray-400 hover:text-white"}`}
                >
                  {demoMode ? "✓ DEMO DATA ON" : "SHOW DEMO DATA"}
                </button>
                <hr className="border-[#2a2a4a]" />
                <button
                  onClick={handleSignOut}
                  className="font-pixel-body text-lg text-pixel-red hover:text-red-300 text-left py-1"
                >
                  LOGOUT
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </header>
  );
}
