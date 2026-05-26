"use client";

import { useState } from "react";
import { getMonthlyBadge, getYearlyBadge, getBadgeGradient } from "@/lib/rewards";
import { playLevelUp } from "@/lib/sounds";

/* ---------- types ---------- */

interface MonthRecord {
  month: string;
  shortMonth: string;
  completionPct: number;
  earned: boolean;
}

interface YearRecord {
  year: number;
  goalsMetPct: number;
  inProgress: boolean;
}

/* ---------- mock data ---------- */

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const MONTH_SHORT = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

const MONTHLY_DATA_2025: MonthRecord[] = MONTH_NAMES.map((m, i) => ({
  month: m,
  shortMonth: MONTH_SHORT[i],
  completionPct: 0,
  earned: false,
}));

const YEARLY_DATA: YearRecord[] = [
  { year: 2025, goalsMetPct: 0, inProgress: true },
];

/* ---------- helpers ---------- */

const BORDER_COLORS: Record<string, string> = {
  gold: "#ffd700",
  silver: "#c0c0c0",
  bronze: "#cd7f32",
  grey: "#666",
  legendary: "#ffd700",
};

function computeStats(months: MonthRecord[]) {
  const earned = months.filter((m) => m.earned);
  const totalBadges = earned.length;

  // Best consecutive Mars Pioneer (gold) streak
  let bestStreak = 0;
  let currentStreak = 0;
  for (const m of months) {
    if (m.earned && m.completionPct >= 0.9) {
      currentStreak++;
      bestStreak = Math.max(bestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  // Overall completion rate across earned months
  const overallRate =
    earned.length > 0
      ? Math.round(
          (earned.reduce((sum, m) => sum + m.completionPct, 0) / earned.length) * 100
        )
      : 0;

  return { totalBadges, bestStreak, overallRate };
}

/* ---------- component ---------- */

export default function TrophiesPage() {
  const [months] = useState<MonthRecord[]>(MONTHLY_DATA_2025);
  const [years] = useState<YearRecord[]>(YEARLY_DATA);
  const [tappedBadge, setTappedBadge] = useState<string | null>(null);

  // Current month badge (May 2025 in mock data, index 4)
  const currentMonthIdx = 4;
  const currentMonth = months[currentMonthIdx];
  const currentBadge = getMonthlyBadge(currentMonth.completionPct);

  const stats = computeStats(months);

  const handleBadgeTap = (monthKey: string, level: string) => {
    if (level === "gold" || level === "legendary") {
      playLevelUp();
      setTappedBadge(monthKey);
      setTimeout(() => setTappedBadge(null), 1200);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6">
      {/* Page title */}
      <h2 className="font-pixel text-xs text-pixel-cyan mb-4">TROPHY CASE</h2>

      {/* ===== Current Month Badge ===== */}
      <section className="pixel-card p-6 flex flex-col items-center text-center">
        <p className="font-pixel text-[10px] text-pixel-green mb-3">
          THIS MONTH
        </p>
        <div
          className={`w-24 h-24 flex items-center justify-center bg-gradient-to-br ${getBadgeGradient(currentBadge.level)} ${
            currentBadge.level === "gold" ? "animate-glow" : ""
          } transition-transform`}
          style={{ borderRadius: "4px" }}
        >
          <span className="text-5xl">{currentBadge.emoji}</span>
        </div>
        <p className="font-pixel text-[10px] text-pixel-gold mt-3">
          {currentBadge.name.toUpperCase()}
        </p>
        <p className="font-pixel-body text-sm text-gray-400 mt-1">
          {currentMonth.month} 2025 &mdash;{" "}
          {Math.round(currentMonth.completionPct * 100)}% completion
        </p>
        <div className="flex gap-1 mt-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-2 h-2"
              style={{
                backgroundColor:
                  i < Math.ceil(currentMonth.completionPct * 5)
                    ? currentBadge.color
                    : "#333",
              }}
            />
          ))}
        </div>
      </section>

      {/* ===== Badge Collection Grid ===== */}
      <section>
        <h3 className="font-pixel text-[10px] text-pixel-cyan mb-3">
          2025 BADGE COLLECTION
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {months.map((m) => {
            const badge = m.earned ? getMonthlyBadge(m.completionPct) : null;
            const level = badge?.level ?? "grey";
            const borderColor = BORDER_COLORS[level] ?? "#666";
            const isGold = level === "gold";
            const key = m.shortMonth;

            return (
              <button
                key={key}
                onClick={() => badge && handleBadgeTap(key, level)}
                disabled={!m.earned}
                className={`pixel-card p-3 flex flex-col items-center text-center relative transition-transform
                  ${m.earned ? "cursor-pointer hover:scale-105 active:scale-95" : "opacity-40 cursor-default"}
                  ${isGold ? "animate-glow" : ""}
                  ${tappedBadge === key ? "scale-110" : ""}`}
                style={{ borderColor, borderWidth: "2px", borderStyle: "solid" }}
              >
                {/* Locked overlay */}
                {!m.earned && (
                  <div className="absolute inset-0 flex items-center justify-center z-10 text-2xl">
                    <span role="img" aria-label="locked">
                      🔒
                    </span>
                  </div>
                )}

                {/* Badge emoji */}
                <div
                  className={`w-12 h-12 flex items-center justify-center bg-gradient-to-br ${getBadgeGradient(level)} mb-2`}
                  style={{ borderRadius: "2px" }}
                >
                  <span className="text-2xl">
                    {m.earned ? badge!.emoji : "?"}
                  </span>
                </div>

                {/* Month label */}
                <p className="font-pixel text-[8px] text-gray-400">
                  {m.shortMonth}
                </p>

                {/* Badge name */}
                {m.earned ? (
                  <>
                    <p
                      className={`font-pixel text-[8px] mt-1 ${
                        isGold ? "text-pixel-gold" : "text-white"
                      }`}
                    >
                      {badge!.name.toUpperCase()}
                    </p>
                    <p className="font-pixel-body text-xs text-gray-500 mt-0.5">
                      {Math.round(m.completionPct * 100)}%
                    </p>
                  </>
                ) : (
                  <p className="font-pixel text-[8px] mt-1 text-gray-600">
                    LOCKED
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* ===== Yearly Trophies ===== */}
      <section>
        <h3 className="font-pixel text-[10px] text-pixel-gold mb-3">
          YEARLY TROPHIES
        </h3>
        <div className="flex flex-col gap-3">
          {years.map((yr) => {
            if (yr.inProgress) {
              return (
                <div
                  key={yr.year}
                  className="pixel-card p-4 flex items-center gap-4"
                  style={{ borderColor: "#444", borderWidth: "2px", borderStyle: "dashed" }}
                >
                  <div className="w-14 h-14 flex items-center justify-center bg-gray-800 shrink-0">
                    <span className="text-2xl">⏳</span>
                  </div>
                  <div>
                    <p className="font-pixel text-[10px] text-gray-400">
                      {yr.year}
                    </p>
                    <p className="font-pixel-body text-lg text-gray-500 mt-1">
                      In progress...
                    </p>
                  </div>
                </div>
              );
            }

            const trophy = getYearlyBadge(yr.goalsMetPct);
            const borderColor = BORDER_COLORS[trophy.level] ?? "#666";
            const isGoldOrAbove =
              trophy.level === "gold" || trophy.level === "legendary";

            return (
              <button
                key={yr.year}
                onClick={() => isGoldOrAbove && playLevelUp()}
                className={`pixel-card p-4 flex items-center gap-4 text-left transition-transform
                  ${isGoldOrAbove ? "animate-glow cursor-pointer hover:scale-[1.02] active:scale-[0.98]" : "cursor-default"}`}
                style={{ borderColor, borderWidth: "2px", borderStyle: "solid" }}
              >
                <div
                  className={`w-14 h-14 flex items-center justify-center bg-gradient-to-br ${getBadgeGradient(trophy.level)} shrink-0`}
                >
                  <span className="text-2xl">{trophy.emoji}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-pixel text-[10px] text-gray-400">
                    {yr.year}
                  </p>
                  <p
                    className={`font-pixel text-[10px] mt-1 ${
                      isGoldOrAbove ? "text-pixel-gold" : "text-white"
                    }`}
                  >
                    {trophy.name.toUpperCase()}
                  </p>
                  <p className="font-pixel-body text-sm text-gray-500 mt-0.5">
                    {Math.round(yr.goalsMetPct * 100)}% goals met
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ===== Stats Summary ===== */}
      <section>
        <h3 className="font-pixel text-[10px] text-pixel-purple mb-3">
          STATS
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="pixel-card p-4 text-center">
            <p className="font-pixel text-[8px] text-pixel-cyan">
              TOTAL BADGES
            </p>
            <p className="font-pixel-body text-3xl text-white mt-2">
              {stats.totalBadges}
            </p>
          </div>
          <div className="pixel-card p-4 text-center">
            <p className="font-pixel text-[8px] text-pixel-gold">
              BEST STREAK
            </p>
            <p className="font-pixel-body text-3xl text-white mt-2">
              {stats.bestStreak}
            </p>
            <p className="font-pixel-body text-xs text-gray-500 mt-1">
              gold months
            </p>
          </div>
          <div className="pixel-card p-4 text-center col-span-2 sm:col-span-1">
            <p className="font-pixel text-[8px] text-pixel-green">
              AVG COMPLETION
            </p>
            <p className="font-pixel-body text-3xl text-white mt-2">
              {stats.overallRate}%
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
