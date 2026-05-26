"use client";

import { useEffect, useState } from "react";

interface Comet {
  id: number;
  top: number;
  left: number;
  duration: number;
  size: number;
}

export function ShootingStar() {
  const [comets, setComets] = useState<Comet[]>([]);

  useEffect(() => {
    let counter = 0;
    const spawn = () => {
      const comet: Comet = {
        id: counter++,
        top: Math.random() * 30,
        left: 40 + Math.random() * 50,
        duration: 1.2 + Math.random() * 0.8,
        size: 3 + Math.floor(Math.random() * 3),
      };
      setComets((prev) => [...prev.slice(-2), comet]);
    };

    spawn();
    const interval = setInterval(spawn, 6000 + Math.random() * 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {comets.map((c) => (
        <div
          key={c.id}
          className="fixed pointer-events-none z-0"
          style={{
            top: `${c.top}%`,
            left: `${c.left}%`,
            animation: `comet-fly ${c.duration}s linear forwards`,
          }}
        >
          {/* Comet head — bright glowing pixel */}
          <div
            style={{
              width: c.size,
              height: c.size,
              background: "#fff",
              boxShadow: `0 0 ${c.size * 2}px ${c.size}px #00ffff88, 0 0 ${c.size * 4}px ${c.size * 2}px #00ffff44`,
              imageRendering: "pixelated",
              position: "relative",
            }}
          >
            {/* Tail — multiple fading pixel segments */}
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: (i + 1) * (c.size + 1),
                  top: Math.floor(c.size / 2) - 1,
                  width: c.size - 1,
                  height: Math.max(2, c.size - i),
                  background: i < 3 ? "#00ffff" : i < 5 ? "#00ffffaa" : i < 7 ? "#b967ff66" : "#b967ff33",
                  opacity: 1 - i * 0.12,
                  imageRendering: "pixelated",
                }}
              />
            ))}
          </div>
        </div>
      ))}
      <style jsx>{`
        @keyframes comet-fly {
          0% {
            transform: translate(0, 0);
            opacity: 0;
          }
          5% {
            opacity: 1;
          }
          85% {
            opacity: 0.7;
          }
          100% {
            transform: translate(-500px, 300px);
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
}
