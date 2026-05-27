"use client";

import { useState, useMemo } from "react";

interface Props {
  value: string | null;
  onChange: (iso: string | null) => void;
}

const DAYS = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function startDay(year: number, month: number) {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

export function DateTimePicker({ value, onChange }: Props) {
  const parsed = value ? new Date(value) : null;
  const now = new Date();

  const [viewYear, setViewYear] = useState(parsed?.getFullYear() ?? now.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.getMonth() ?? now.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(parsed);
  const [step, setStep] = useState<"date" | "hour" | "minute">("date");
  const [hour, setHour] = useState(parsed ? parsed.getHours() % 12 || 12 : 12);
  const [minute, setMinute] = useState(parsed ? parsed.getMinutes() : 0);
  const [amPm, setAmPm] = useState<"AM" | "PM">(parsed && parsed.getHours() >= 12 ? "PM" : "AM");

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
    const d = new Date(viewYear, viewMonth, day);
    setSelectedDate(d);
    setStep("hour");
  };

  const pickHour = (h: number) => {
    setHour(h);
    setStep("minute");
  };

  const pickMinute = (m: number) => {
    setMinute(m);
    finalize(selectedDate!, hour, m, amPm);
  };

  const finalize = (date: Date, h: number, m: number, ap: "AM" | "PM") => {
    let h24 = h % 12;
    if (ap === "PM") h24 += 12;
    const result = new Date(date.getFullYear(), date.getMonth(), date.getDate(), h24, m);
    onChange(result.toISOString());
  };

  const clear = () => {
    onChange(null);
    setSelectedDate(null);
    setStep("date");
  };

  const clockRadius = 90;
  const clockCenter = 105;

  return (
    <div className="pixel-card p-4 w-full max-w-[260px]">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-3">
        {(["date", "hour", "minute"] as const).map((s, i) => (
          <button
            key={s}
            onClick={() => { if (s === "date" || selectedDate) setStep(s); }}
            className={`font-pixel text-[6px] px-2 py-1 transition-colors ${
              step === s
                ? "text-pixel-cyan border-b-2 border-pixel-cyan"
                : "text-gray-600 hover:text-gray-400"
            }`}
          >
            {s === "date" ? "DATE" : s === "hour" ? "HOUR" : "MIN"}
          </button>
        ))}
        <div className="flex-1" />
        {value && (
          <button onClick={clear} className="font-pixel text-[6px] text-pixel-red hover:text-red-300">
            CLEAR
          </button>
        )}
      </div>

      {/* Current value preview */}
      {selectedDate && (
        <p className="font-pixel-body text-sm text-pixel-cyan text-center mb-3">
          {selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          {step !== "date" && ` · ${hour}:${minute.toString().padStart(2, "0")} ${amPm}`}
        </p>
      )}

      {/* ── Date picker ── */}
      {step === "date" && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <button onClick={prevMonth} className="font-pixel-body text-lg text-gray-400 hover:text-pixel-cyan px-2">◀</button>
            <p className="font-pixel text-[7px] text-gray-400">
              {MONTHS[viewMonth]} {viewYear}
            </p>
            <button onClick={nextMonth} className="font-pixel-body text-lg text-gray-400 hover:text-pixel-cyan px-2">▶</button>
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {DAYS.map((d) => (
              <div key={d} className="font-pixel text-[5px] text-gray-600 text-center py-1">{d}</div>
            ))}
            {Array.from({ length: offset }).map((_, i) => (
              <div key={`e${i}`} />
            ))}
            {Array.from({ length: days }).map((_, i) => {
              const day = i + 1;
              const cellStr = `${viewYear}-${viewMonth}-${day}`;
              const isToday = cellStr === todayStr;
              const isSelected = cellStr === selectedStr;
              return (
                <button
                  key={day}
                  onClick={() => pickDay(day)}
                  className={`font-pixel-body text-sm py-1.5 text-center transition-colors ${
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
        </div>
      )}

      {/* ── Hour picker (clock face) ── */}
      {step === "hour" && (
        <div className="flex flex-col items-center">
          <div className="relative" style={{ width: clockCenter * 2, height: clockCenter * 2 }}>
            {/* Clock circle */}
            <div
              className="absolute inset-2 rounded-full"
              style={{ border: "2px solid #2a2a4a", background: "#0a0a18" }}
            />
            {/* Center dot */}
            <div
              className="absolute rounded-full bg-pixel-cyan"
              style={{
                width: 6, height: 6,
                top: clockCenter - 3, left: clockCenter - 3,
              }}
            />
            {/* Hand */}
            {(() => {
              const angle = ((hour % 12) / 12) * 360 - 90;
              const rad = (angle * Math.PI) / 180;
              const x2 = clockCenter + Math.cos(rad) * (clockRadius - 18);
              const y2 = clockCenter + Math.sin(rad) * (clockRadius - 18);
              return (
                <svg className="absolute inset-0" style={{ width: clockCenter * 2, height: clockCenter * 2 }}>
                  <line x1={clockCenter} y1={clockCenter} x2={x2} y2={y2} stroke="#00ffff" strokeWidth="2" strokeOpacity="0.5" />
                </svg>
              );
            })()}
            {/* Hour numbers */}
            {Array.from({ length: 12 }).map((_, i) => {
              const h = i + 1;
              const angle = (h / 12) * 360 - 90;
              const rad = (angle * Math.PI) / 180;
              const x = clockCenter + Math.cos(rad) * (clockRadius - 16) - 12;
              const y = clockCenter + Math.sin(rad) * (clockRadius - 16) - 12;
              const isActive = hour === h;
              return (
                <button
                  key={h}
                  onClick={() => pickHour(h)}
                  className={`absolute w-6 h-6 flex items-center justify-center font-pixel-body text-sm transition-colors ${
                    isActive
                      ? "bg-pixel-cyan text-space-dark"
                      : "text-gray-400 hover:text-white"
                  }`}
                  style={{ left: x, top: y, borderRadius: "50%" }}
                >
                  {h}
                </button>
              );
            })}
          </div>
          {/* AM/PM toggle */}
          <div className="flex gap-1 mt-3">
            {(["AM", "PM"] as const).map((ap) => (
              <button
                key={ap}
                onClick={() => setAmPm(ap)}
                className={`font-pixel text-[7px] px-3 py-1.5 border-2 transition-colors ${
                  amPm === ap
                    ? "border-pixel-cyan text-pixel-cyan bg-[#1a1a3a]"
                    : "border-[#2a2a4a] text-gray-500 hover:text-white"
                }`}
              >
                {ap}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Minute picker (clock face) ── */}
      {step === "minute" && (
        <div className="flex flex-col items-center">
          <div className="relative" style={{ width: clockCenter * 2, height: clockCenter * 2 }}>
            <div
              className="absolute inset-2 rounded-full"
              style={{ border: "2px solid #2a2a4a", background: "#0a0a18" }}
            />
            <div
              className="absolute rounded-full bg-pixel-cyan"
              style={{
                width: 6, height: 6,
                top: clockCenter - 3, left: clockCenter - 3,
              }}
            />
            {/* Hand */}
            {(() => {
              const angle = (minute / 60) * 360 - 90;
              const rad = (angle * Math.PI) / 180;
              const x2 = clockCenter + Math.cos(rad) * (clockRadius - 14);
              const y2 = clockCenter + Math.sin(rad) * (clockRadius - 14);
              return (
                <svg className="absolute inset-0" style={{ width: clockCenter * 2, height: clockCenter * 2 }}>
                  <line x1={clockCenter} y1={clockCenter} x2={x2} y2={y2} stroke="#00ffff" strokeWidth="2" strokeOpacity="0.5" />
                </svg>
              );
            })()}
            {/* Minute numbers (every 5 min) */}
            {Array.from({ length: 12 }).map((_, i) => {
              const m = i * 5;
              const angle = (m / 60) * 360 - 90;
              const rad = (angle * Math.PI) / 180;
              const x = clockCenter + Math.cos(rad) * (clockRadius - 14) - 12;
              const y = clockCenter + Math.sin(rad) * (clockRadius - 14) - 12;
              const isActive = minute === m;
              return (
                <button
                  key={m}
                  onClick={() => pickMinute(m)}
                  className={`absolute w-6 h-6 flex items-center justify-center font-pixel-body text-xs transition-colors ${
                    isActive
                      ? "bg-pixel-cyan text-space-dark"
                      : "text-gray-400 hover:text-white"
                  }`}
                  style={{ left: x, top: y, borderRadius: "50%" }}
                >
                  {m.toString().padStart(2, "0")}
                </button>
              );
            })}
          </div>
          {/* Quick confirm with current selection */}
          <p className="font-pixel text-[6px] text-gray-500 mt-2">
            {hour}:{minute.toString().padStart(2, "0")} {amPm}
          </p>
        </div>
      )}
    </div>
  );
}
