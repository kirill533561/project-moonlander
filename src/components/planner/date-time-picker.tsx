"use client";

import { useState, useRef, useCallback, useMemo } from "react";
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

// ── Clock face with drag ──

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
  const OUTER_R = 95;
  const INNER_R = 62;

  const getPointerPos = (e: React.PointerEvent | PointerEvent) => {
    const rect = clockRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const resolveHour = useCallback((x: number, y: number) => {
    const angle = getAngle(C, C, x, y);
    const dist = getDist(C, C, x, y);
    const segment = Math.round(angle / 30) % 12;
    const isInner = dist < (OUTER_R + INNER_R) / 2;
    if (isInner) {
      return segment === 0 ? 0 : segment + 12;
    }
    return segment === 0 ? 12 : segment;
  }, []);

  const resolveMinute = useCallback((x: number, y: number) => {
    const angle = getAngle(C, C, x, y);
    return Math.round(angle / 6) % 60;
  }, []);

  const handlePointer = useCallback((x: number, y: number) => {
    if (mode === "hour") {
      onHourChange(resolveHour(x, y));
    } else {
      onMinuteChange(resolveMinute(x, y));
    }
  }, [mode, resolveHour, resolveMinute, onHourChange, onMinuteChange]);

  const onDown = (e: React.PointerEvent) => {
    dragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const { x, y } = getPointerPos(e);
    handlePointer(x, y);
  };

  const onMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const { x, y } = getPointerPos(e);
    handlePointer(x, y);
  };

  const onUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    onDone();
  };

  const handAngle = mode === "hour"
    ? ((hour % 12) / 12) * 360
    : (minute / 60) * 360;

  const isInner = mode === "hour" && (hour === 0 || hour > 12);
  const handLen = mode === "hour" ? (isInner ? INNER_R - 14 : OUTER_R - 14) : OUTER_R - 14;

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
      {/* Background circle */}
      <div
        className="absolute rounded-full"
        style={{
          inset: 4,
          background: "#0a0a18",
          border: "2px solid #2a2a4a",
        }}
      />

      {/* Hand + dot */}
      <svg className="absolute inset-0 pointer-events-none" width={SIZE} height={SIZE}>
        <motion.line
          x1={C} y1={C}
          animate={{ x2: hx, y2: hy }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          stroke="#00ffff"
          strokeWidth="2"
        />
        <motion.circle
          animate={{ cx: hx, cy: hy }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          r="16"
          fill="#00ffff"
          fillOpacity="0.15"
          stroke="#00ffff"
          strokeWidth="1.5"
        />
        <circle cx={C} cy={C} r="4" fill="#00ffff" />
      </svg>

      {mode === "hour" && (
        <>
          {/* Outer ring: 1–12 */}
          {Array.from({ length: 12 }).map((_, i) => {
            const h = i === 0 ? 12 : i;
            const angle = (i / 12) * 360 - 90;
            const rad = (angle * Math.PI) / 180;
            const x = C + Math.cos(rad) * (OUTER_R - 14) - 10;
            const y = C + Math.sin(rad) * (OUTER_R - 14) - 10;
            const active = hour === h;
            return (
              <div
                key={h}
                className={`absolute w-5 h-5 flex items-center justify-center font-pixel-body text-xs pointer-events-none transition-colors ${
                  active ? "text-space-dark font-bold" : "text-gray-300"
                }`}
                style={{ left: x, top: y }}
              >
                {h}
              </div>
            );
          })}
          {/* Inner ring: 13–24 (0) */}
          {Array.from({ length: 12 }).map((_, i) => {
            const h = i === 0 ? 0 : i + 12;
            const label = h.toString().padStart(2, "0");
            const angle = (i / 12) * 360 - 90;
            const rad = (angle * Math.PI) / 180;
            const x = C + Math.cos(rad) * (INNER_R - 10) - 10;
            const y = C + Math.sin(rad) * (INNER_R - 10) - 10;
            const active = hour === h;
            return (
              <div
                key={`i${h}`}
                className={`absolute w-5 h-5 flex items-center justify-center font-pixel-body text-[11px] pointer-events-none transition-colors ${
                  active ? "text-space-dark font-bold" : "text-gray-500"
                }`}
                style={{ left: x, top: y }}
              >
                {label}
              </div>
            );
          })}
        </>
      )}

      {mode === "minute" && (
        <>
          {Array.from({ length: 12 }).map((_, i) => {
            const m = i * 5;
            const angle = (m / 60) * 360 - 90;
            const rad = (angle * Math.PI) / 180;
            const x = C + Math.cos(rad) * (OUTER_R - 14) - 10;
            const y = C + Math.sin(rad) * (OUTER_R - 14) - 10;
            const active = minute === m;
            return (
              <div
                key={m}
                className={`absolute w-5 h-5 flex items-center justify-center font-pixel-body text-xs pointer-events-none transition-colors ${
                  active ? "text-space-dark font-bold" : "text-gray-300"
                }`}
                style={{ left: x, top: y }}
              >
                {m.toString().padStart(2, "0")}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

// ── Main component ──

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
  const selectedStr = selectedDate
    ? `${selectedDate.getFullYear()}-${selectedDate.getMonth()}-${selectedDate.getDate()}`
    : "";

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const pickDay = (day: number) => {
    setSelectedDate(new Date(viewYear, viewMonth, day));
    setStep("hour");
  };

  const finalize = (date: Date, h: number, m: number) => {
    onChange(new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, m).toISOString());
  };

  const clear = () => {
    onChange(null);
    setSelectedDate(null);
    setStep("date");
  };

  const fmtTime = (h: number, m: number) => {
    const ap = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, "0")} ${ap}`;
  };

  return (
    <div className="pixel-card p-4 w-full max-w-[280px]">
      {/* Header with clickable time display */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => { if (selectedDate) setStep("date"); }}
            className={`font-pixel text-[7px] px-2 py-1 transition-colors ${
              step === "date" ? "text-pixel-cyan" : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {selectedDate
              ? selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
              : "DATE"}
          </button>
          {selectedDate && (
            <>
              <span className="text-gray-600 font-pixel-body text-xs">·</span>
              <button
                onClick={() => setStep("hour")}
                className={`font-pixel-body text-sm px-1 transition-colors ${
                  step === "hour" ? "text-pixel-cyan" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {hour.toString().padStart(2, "0")}
              </button>
              <span className={`font-pixel-body text-sm ${step === "hour" || step === "minute" ? "text-pixel-cyan" : "text-gray-600"}`}>:</span>
              <button
                onClick={() => setStep("minute")}
                className={`font-pixel-body text-sm px-1 transition-colors ${
                  step === "minute" ? "text-pixel-cyan" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {minute.toString().padStart(2, "0")}
              </button>
            </>
          )}
        </div>
        {value && (
          <button onClick={clear} className="font-pixel text-[6px] text-pixel-red hover:text-red-300">CLEAR</button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* ── Date ── */}
        {step === "date" && (
          <motion.div
            key="date"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between mb-2">
              <button onClick={prevMonth} className="font-pixel-body text-lg text-gray-400 hover:text-pixel-cyan px-2">◀</button>
              <p className="font-pixel text-[7px] text-gray-400">{MONTHS[viewMonth]} {viewYear}</p>
              <button onClick={nextMonth} className="font-pixel-body text-lg text-gray-400 hover:text-pixel-cyan px-2">▶</button>
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {DAYS.map((d) => (
                <div key={d} className="font-pixel text-[5px] text-gray-600 text-center py-1">{d}</div>
              ))}
              {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: days }).map((_, i) => {
                const day = i + 1;
                const cellStr = `${viewYear}-${viewMonth}-${day}`;
                const isToday = cellStr === todayStr;
                const isSelected = cellStr === selectedStr;
                return (
                  <button
                    key={day}
                    onClick={() => pickDay(day)}
                    className={`font-pixel-body text-sm py-1.5 text-center transition-all ${
                      isSelected
                        ? "bg-pixel-cyan text-space-dark"
                        : isToday
                          ? "text-pixel-cyan border border-pixel-cyan/40"
                          : "text-gray-400 hover:bg-[#1a1a3a] hover:text-white"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── Hour ── */}
        {step === "hour" && (
          <motion.div
            key="hour"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center"
          >
            <p className="font-pixel text-[6px] text-gray-600 mb-2">SELECT HOUR</p>
            <ClockDial
              mode="hour"
              hour={hour}
              minute={minute}
              onHourChange={setHour}
              onMinuteChange={setMinute}
              onDone={() => setStep("minute")}
            />
          </motion.div>
        )}

        {/* ── Minute ── */}
        {step === "minute" && (
          <motion.div
            key="minute"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center"
          >
            <p className="font-pixel text-[6px] text-gray-600 mb-2">SELECT MINUTE</p>
            <ClockDial
              mode="minute"
              hour={hour}
              minute={minute}
              onHourChange={setHour}
              onMinuteChange={setMinute}
              onDone={() => {
                if (selectedDate) finalize(selectedDate, hour, minute);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
