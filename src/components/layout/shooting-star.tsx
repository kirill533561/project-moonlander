"use client";

import { useEffect, useState } from "react";

interface Star {
  id: number;
  top: number;
  left: number;
  duration: number;
}

export function ShootingStar() {
  const [stars, setStars] = useState<Star[]>([]);

  useEffect(() => {
    let counter = 0;

    const spawn = () => {
      const star: Star = {
        id: counter++,
        top: Math.random() * 35,
        left: 40 + Math.random() * 50,
        duration: 1 + Math.random() * 0.5,
      };
      setStars((prev) => [...prev.slice(-2), star]);
    };

    spawn();
    const interval = setInterval(spawn, 5000 + Math.random() * 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {stars.map((star) => (
        <div
          key={star.id}
          className="fixed pointer-events-none z-0"
          style={{
            top: `${star.top}%`,
            left: `${star.left}%`,
            animation: `pixel-shoot ${star.duration}s steps(20) forwards`,
            imageRendering: "pixelated",
          }}
        >
          {/* 8-bit shooting star: head + pixel trail */}
          <div className="relative">
            {/* Bright head */}
            <div
              className="absolute"
              style={{
                width: 4,
                height: 4,
                background: "#fff",
                boxShadow: "0 0 0 1px #00ffff, 2px 0 0 #00ffff, 4px 0 0 #00ffff",
              }}
            />
            {/* Trail pixels */}
            <div
              className="absolute"
              style={{
                left: 6,
                top: 1,
                width: 3,
                height: 2,
                background: "#00ffff",
                boxShadow:
                  "4px 0 0 #00ffffaa, 8px 0 0 #00ffff77, 12px 0 0 #00ffff55, 16px 0 0 #00ffff33, 20px 0 0 #00ffff22, 24px 0 0 #00ffff11",
              }}
            />
          </div>
        </div>
      ))}
      <style jsx>{`
        @keyframes pixel-shoot {
          0% {
            transform: translate(0, 0);
            opacity: 1;
          }
          80% {
            opacity: 0.8;
          }
          100% {
            transform: translate(-350px, 220px);
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
}
