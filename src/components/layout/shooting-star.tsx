"use client";

import { useEffect, useState } from "react";

interface Star {
  id: number;
  top: number;
  left: number;
  duration: number;
  delay: number;
  angle: number;
}

export function ShootingStar() {
  const [stars, setStars] = useState<Star[]>([]);

  useEffect(() => {
    let counter = 0;
    const spawn = () => {
      const star: Star = {
        id: counter++,
        top: Math.random() * 40,
        left: 30 + Math.random() * 60,
        duration: 0.8 + Math.random() * 0.6,
        delay: 0,
        angle: 35 + Math.random() * 20,
      };
      setStars((prev) => [...prev.slice(-3), star]);
    };

    const interval = setInterval(spawn, 4000 + Math.random() * 6000);
    const timeout = setTimeout(spawn, 2000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
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
            animation: `shooting-star ${star.duration}s linear forwards`,
            transform: `rotate(${star.angle}deg)`,
          }}
        >
          <div
            className="h-[1px] bg-gradient-to-r from-white via-cyan-200 to-transparent"
            style={{ width: "80px" }}
          />
        </div>
      ))}
      <style jsx>{`
        @keyframes shooting-star {
          0% {
            transform: translateX(0) translateY(0) rotate(var(--angle, 40deg));
            opacity: 1;
          }
          70% {
            opacity: 0.8;
          }
          100% {
            transform: translateX(-400px) translateY(250px) rotate(var(--angle, 40deg));
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
}
