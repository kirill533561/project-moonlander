"use client";

import { useState } from "react";
import { playCounterClick, playLevelUp } from "@/lib/sounds";

export function MoonEasterEgg() {
  const [clicks, setClicks] = useState(0);
  const [ripple, setRipple] = useState(false);

  const maxGlow = 12;
  const glow = Math.min(clicks, maxGlow);
  const spread1 = 20 + glow * 8;
  const spread2 = 50 + glow * 15;
  const spread3 = 80 + glow * 20;
  const opacity1 = 0.3 + glow * 0.05;
  const opacity2 = 0.15 + glow * 0.04;
  const opacity3 = 0.08 + glow * 0.03;

  const handleClick = () => {
    const next = clicks + 1;
    setClicks(next);
    setRipple(true);
    setTimeout(() => setRipple(false), 400);

    if (next === maxGlow) {
      playLevelUp();
    } else {
      playCounterClick();
    }
  };

  return (
    <div
      onClick={handleClick}
      className="fixed z-[2] cursor-pointer"
      style={{
        top: "4%",
        right: "6%",
        width: 70,
        height: 70,
      }}
      title={clicks >= maxGlow ? "MAXIMUM POWER!" : `Click to charge (${clicks}/${maxGlow})`}
    >
      {/* Glow layers */}
      <div
        className="absolute inset-0 rounded-full transition-all duration-300"
        style={{
          background: `radial-gradient(circle, rgba(255,215,0,${opacity1}) 0%, rgba(255,215,0,${opacity2}) 50%, transparent 70%)`,
          boxShadow: `0 0 ${spread1}px rgba(255,215,0,${opacity1}), 0 0 ${spread2}px rgba(255,215,0,${opacity2}), 0 0 ${spread3}px rgba(255,215,0,${opacity3})`,
          transform: `scale(${1 + glow * 0.15})`,
        }}
      />

      {/* Ripple on click */}
      {ripple && (
        <div
          className="absolute inset-0 rounded-full animate-ping"
          style={{
            border: "2px solid #ffd70066",
          }}
        />
      )}

      {/* Max power sparkles */}
      {clicks >= maxGlow && (
        <>
          <div className="absolute -top-2 left-1/2 w-1 h-1 bg-pixel-gold animate-ping" style={{ animationDuration: "1.5s" }} />
          <div className="absolute top-1/2 -right-2 w-1 h-1 bg-pixel-gold animate-ping" style={{ animationDuration: "2s", animationDelay: "0.3s" }} />
          <div className="absolute -bottom-2 left-1/2 w-1 h-1 bg-pixel-gold animate-ping" style={{ animationDuration: "1.8s", animationDelay: "0.6s" }} />
          <div className="absolute top-1/2 -left-2 w-1 h-1 bg-pixel-gold animate-ping" style={{ animationDuration: "1.6s", animationDelay: "0.9s" }} />
        </>
      )}
    </div>
  );
}
