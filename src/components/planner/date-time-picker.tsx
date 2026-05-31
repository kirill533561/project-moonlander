"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  value: string | null;
  onChange: (iso: string | null) => void;
}

const DAYS = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function startDay(y: number, m: number) { const d = new Date(y, m, 1).getDay(); return d === 0 ? 6 : d - 1; }

function getAngle(cx: number, cy: number, x: number, y: number) {
  let deg = (Math.atan2(y - cy, x - cx) * 180) / Math.PI + 90;
  if (deg < 0) deg += 360;
  return deg;
}

function getDist(cx: number, cy: number, x: number, y: number) {
  return Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
}

function ClockDial({
  mode,
  hour,
  minute,
  onHourChange,
  onMinuteChange,
  onDone,
}: {
  mode: "hour" | "minute";
  hour: number;
  minute: number;
  onHourChange: (h: number) => void;
  onMinuteChange: (m: number) => void;
  onDone: () => void;
}) {
  const clockRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const SIZE = 240;
  const C = SIZE / 2;
  const OUTER_R = 96;
  const INNER_R = 60;
  const BOUNDARY = 78;

  const getPointerPos = (e: React.PointerEvent | PointerEvent) => {
    const rect = clockRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const resolveHour = useCallback((x: number, y: number) => {
    const angle = getAngle(C, C, x, y);
    const dist = getDist(C, C, x, y);
    const segment = Math.round(angle / 30) % 12;
    if (dist < BOUNDARY) {
      return segment === 0 ? 0 : segment + 12;
    }
    return segment === 0 ? 12 : segment;
  }, []);

  const resolveMinute = useCallback((x: number, y: number) => {
    const angle = getAngle(C, C, x, y);
    return Math.round(angle / 6) % 60;
  }, []);

  const handlePointer = useCallback((x: number, y: number) => {
    if (mode === "hour") onHourChange(resolveHour(x, y));
    else onMinuteChange(resolveMinute(x, y));
  }, [mode, resolveHour, resolveMinute, onHourChange, onMinuteChange]);

  const onDown = (e: React.PointerEvent) => {
    dragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    handlePointer(...Object.values(getPointerPos(e)) as [number, number]);
  };

  const onMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    handlePointer(...Object.values(getPointerPos(e)) as [number, number]);
  };

  const onUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    onDone();
  };

  const handAngle = mode === "hour" ? ((hour % 12) / 12) * 360 : (minute / 60) * 360;
  const isInner = mode === "hour" && (hour === 0 || hour > 12);
  const handLen = mode === "hour" ? (isInner ? INNER_R - 6 : OUTER_R - 12) : OUTER_R - 12;
  const handRad = ((handAngle - 90) * Math.PI) / 180;
  const hx = C + Math.cos(handRad) * handLen;
  const hy = C + Math.sin(handRad) * handLen;

  return (
    <div
      ref={clockRef}
      className="relative select-none touch-none cursor-pointer"
      style={{ width: SIZE, height: SIZE }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      <div className="absolute rounded-full" style={{ inset: 4, background: "#0a0a18", border: "2px solid #2a2a4a" }} />

      <svg className="absolute inset-0 pointer-events-none" width={SIZE} height={SIZE}>
        <motion.line
          x1={C} y1={C}
          animate={{ x2: hx, y2: hy }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          stroke="#00ffff" strokeWidth="2"
        />
        <motion.circle
          animate={{ cx: hx, cy: hy }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          r="15" fill="#00ffff" fillOpacity="0.2" stroke="#00ffff" strokeWidth="1.5"
        />
        <circle cx={C} cy={C} r="4" fill="#00ffff" />
      </svg>

      {mode === "hour" && (
        <>
          {Array.from({ length: 12 }).map((_, i) => {
            const h = i === 0 ? 12 : i;
            const angle = (i / 12) * 360 - 90;
            const rad = (angle * Math.PI) / 180;
            const x = C + Math.cos(rad) * (OUTER_R - 12) - 10;
            const y = C + Math.sin(rad) * (OUTER_R - 12) - 10;
            return (
              <div
                key={h}
                className={`absolute w-5 h-5 flex items-center justify-center font-pixel-body text-xs pointer-events-none ${
                  hour === h ? "text-pixel-cyan font-bold" : "text-gray-300"
                }`}
                style={{ left: x, top: y }}
              >{h}</div>
            );
          })}
          {Array.from({ length: 12 }).map((_, i) => {
            const h = i === 0 ? 0 : i + 12;
            const angle = (i / 12) * 360 - 90;
            const rad = (angle * Math.PI) / 180;
            const x = C + Math.cos(rad) * (INNER_R - 6) - 10;
            const y = C + Math.sin(rad) * (INNER_R - 6) - 10;
            return (
              <div
                key={`i${h}`}
                className={`absolute w-5 h-5 flex items-center justify-center font-pixel-body text-[11px] pointer-events-none ${
                  hour === h ? "text-pixel-cyan font-bold" : "text-gray-500"
                }`}
                style={{ left: x, top: y }}
              >{h.toString().padStart(2, "0")}</div>
            );
          })}
        </>
      )}

      {mode === "minute" && Array.from({ length: 12 }).map((_, i) => {
        const m = i * 5;
        const angle = (m / 60) * 360 - 90;
        const rad = (angle * Math.PI) / 180;
        const x = C + Math.cos(rad) * (OUTER_R - 12) - 10;
        const y = C + Math.sin(rad) * (OUTER_R - 12) - 10;
        return (
          <div
            key={m}
            className={`absolute w-5 h-5 flex items-center justify-center font-pixel-body text-xs pointer-events-none ${
              minute === m ? "text-pixel-cyan font-bold" : "text-gray-300"
            }`}
            style={{ left: x, top: y }}
          >{m.toString().padStart(2, "0")}</div>
        );
      })}
    </div>
  );
}

export function DateTimePicker({ value, onChange }: Props) {
  const parsed = value ? new Date(value) : null;
  const now = new Date();

  const [viewYear, setViewYear] = useState(parsed?.getFullYear() ?? now.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.getMonth() ?? now.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(parsed);
  const [step, setStep] = useState<"date" | "hour" | "minute">("date");
  const [hour, setHour] = useState(parsed ? parsed.getHours() : 12);
  const [minute, setMinute] = useState(parsed ? parsed.getMinutes() : 0);

  const days = useMemo(() => daysInMonth(viewYear, viewMonth), [viewYear, viewMonth]);
  const offset = useMemo(() => startDay(viewYear, viewMonth), [viewYear, viewMonth]);

  const todayStr = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
  const selectedStr = selectedDate ? `${selectedDate.getFullYear()}-${selectedDate.getMonth()}-${selectedDate.getDate()}` : "";

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); } else setViewMonth(viewMonth - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); } else setViewMonth(viewMonth + 1); };

  const pickDay = (day: number) => { setSelectedDate(new Date(viewYear, viewMonth, day)); setStep("hour"); };

  const finalize = (date: Date, h: number, m: number) => {
    onChange(new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, m).toISOString());
  };

  const clear = () => { onChange(null); setSelectedDate(null); setStep("date"); };

  const content = (
    <div className="pixel-card p-4 w-[290px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setStep("date")}
            className={`font-pixel text-[8px] px-2 py-1 transition-colors ${step === "date" ? "text-pixel-cyan" : "text-gray-500 hover:text-gray-300"}`}
          >
            {selectedDate ? selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "DATE"}
          </button>
          {selectedDate && (
            <>
              <span className="text-gray-600 font-pixel-body text-xs">·</span>
              <button
                onClick={() => setStep("hour")}
                className={`font-pixel-body text-base px-1 transition-colors ${step === "hour" ? "text-pixel-cyan" : "text-gray-500 hover:text-gray-300"}`}
              >{hour.toString().padStart(2, "0")}</button>
              <span className="font-pixel-body text-base text-gray-600">:</span>
              <button
                onClick={() => setStep("minute")}
                className={`font-pixel-body text-base px-1 transition-colors ${step === "minute" ? "text-pixel-cyan" : "text-gray-500 hover:text-gray-300"}`}
              >{minute.toString().padStart(2, "0")}</button>
            </>
          )}
        </div>
        {value && (
          <button onClick={clear} className="font-pixel text-[8px] text-pixel-red hover:text-red-300">CLEAR</button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {step === "date" && (
          <motion.div key="date" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.15 }}>
            <div className="flex items-center justify-between mb-2">
              <button onClick={prevMonth} className="font-pixel-body text-lg text-gray-400 hover:text-pixel-cyan px-2">◀</button>
              <p className="font-pixel text-[8px] text-gray-400">{MONTHS[viewMonth]} {viewYear}</p>
              <button onClick={nextMonth} className="font-pixel-body text-lg text-gray-400 hover:text-pixel-cyan px-2">▶</button>
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {DAYS.map((d) => <div key={d} className="font-pixel text-[8px] text-gray-600 text-center py-1">{d}</div>)}
              {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: days }).map((_, i) => {
                const day = i + 1;
                const cellStr = `${viewYear}-${viewMonth}-${day}`;
                return (
                  <button
                    key={day}
                    onClick={() => pickDay(day)}
                    className={`font-pixel-body text-sm py-1.5 text-center transition-all ${
                      cellStr === selectedStr ? "bg-pixel-cyan/20 text-pixel-cyan border border-pixel-cyan"
                      : cellStr === todayStr ? "text-pixel-cyan border border-pixel-cyan/30"
                      : "text-gray-400 hover:bg-[#1a1a3a] hover:text-white"
                    }`}
                  >{day}</button>
                );
              })}
            </div>
          </motion.div>
        )}

        {step === "hour" && (
          <motion.div key="hour" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }} transition={{ duration: 0.15 }} className="flex flex-col items-center">
            <p className="font-pixel text-[8px] text-gray-600 mb-2">SELECT HOUR</p>
            <ClockDial mode="hour" hour={hour} minute={minute} onHourChange={setHour} onMinuteChange={setMinute} onDone={() => setStep("minute")} />
          </motion.div>
        )}

        {step === "minute" && (
          <motion.div key="minute" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }} transition={{ duration: 0.15 }} className="flex flex-col items-center">
            <p className="font-pixel text-[8px] text-gray-600 mb-2">SELECT MINUTE</p>
            <ClockDial mode="minute" hour={hour} minute={minute} onHourChange={setHour} onMinuteChange={setMinute} onDone={() => { if (selectedDate) finalize(selectedDate, hour, minute); }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  if (typeof document === "undefined") return content;

  return createPortal(
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget && selectedDate) finalize(selectedDate, hour, minute); }}>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10"
      >
        {content}
      </motion.div>
    </div>,
    document.body,
  );
}
