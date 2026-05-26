"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export function Header() {
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, [supabase.auth]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-12 px-4 bg-space-deeper/90 backdrop-blur border-b-2 border-[#2a2a4a]">
      <div className="md:hidden">
        <span className="font-pixel text-[8px] text-pixel-cyan">MOONLANDER</span>
      </div>

      <div className="flex items-center gap-3 ml-auto">
        {user && (
          <>
            {user.user_metadata?.avatar_url && (
              <img
                src={user.user_metadata.avatar_url}
                alt=""
                className="w-7 h-7 border-2 border-pixel-cyan"
              />
            )}
            <span className="font-pixel-body text-sm text-gray-400 hidden sm:inline">
              {user.user_metadata?.full_name || user.email}
            </span>
            <button
              onClick={handleSignOut}
              className="font-pixel-body text-xs text-pixel-red hover:text-red-300 ml-2"
            >
              [LOGOUT]
            </button>
          </>
        )}
      </div>
    </header>
  );
}
