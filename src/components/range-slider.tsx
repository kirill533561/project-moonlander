"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface RangeSliderProps {
  min: number;
  max: number;
  valueMin: number;
  valueMax: number;
  onChange: (min: number, max: number) => void;
  formatLabel: (value: number) => string;
  color?: string;
}

export function RangeSlider({ min, max, valueMin, valueMax, onChange, formatLabel, color = "#00ffff" }: RangeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<"min" | "max" | null>(null);

  const range = max - min || 1;
  const leftPct = ((valueMin - min) / range) * 100;
  const rightPct = ((valueMax - min) / range) * 100;

  const getValueFromX = useCallback((clientX: number) => {
    if (!trackRef.current) return min;
    const rect = trackRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.round(min + pct * range);
  }, [min, range]);

  const handlePointerDown = useCallback((handle: "min" | "max") => (e: React.PointerEvent) => {
    e.preventDefault();
    setDragging(handle);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    const val = getValueFromX(e.clientX);
    if (dragging === "min") {
      onChange(Math.min(val, valueMax - 1), valueMax);
    } else {
      onChange(valueMin, Math.max(val, valueMin + 1));
    }
  }, [dragging, getValueFromX, onChange, valueMin, valueMax]);

  const handlePointerUp = useCallback(() => {
    setDragging(null);
  }, []);

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center justify-between font-pixel-body text-base">
        <span style={{ color }}>{formatLabel(valueMin)}</span>
        <span className="text-gray-600">—</span>
        <span style={{ color }}>{formatLabel(valueMax)}</span>
      </div>
      <div
        ref={trackRef}
        className="relative h-6 flex items-center cursor-pointer touch-none"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Track background */}
        <div className="absolute left-0 right-0 h-[4px] bg-[#2a2a4a]" style={{ imageRendering: "pixelated" }} />

        {/* Active range */}
        <div
          className="absolute h-[4px]"
          style={{
            left: `${leftPct}%`,
            width: `${rightPct - leftPct}%`,
            background: color,
            imageRendering: "pixelated",
          }}
        />

        {/* Min handle */}
        <div
          className="absolute w-5 h-5 border-3 cursor-grab active:cursor-grabbing z-10"
          style={{
            left: `calc(${leftPct}% - 10px)`,
            background: "#0f0f2a",
            borderColor: color,
            boxShadow: `0 0 6px ${color}66`,
          }}
          onPointerDown={handlePointerDown("min")}
        />

        {/* Max handle */}
        <div
          className="absolute w-5 h-5 border-3 cursor-grab active:cursor-grabbing z-10"
          style={{
            left: `calc(${rightPct}% - 10px)`,
            background: "#0f0f2a",
            borderColor: color,
            boxShadow: `0 0 6px ${color}66`,
          }}
          onPointerDown={handlePointerDown("max")}
        />
      </div>
    </div>
  );
}
