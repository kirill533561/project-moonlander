"use client";

import { useState } from "react";
import { playCounterClick, playSuccess } from "@/lib/sounds";
import { getMonthlyBadge, getBadgeGradient } from "@/lib/rewards";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/* ---------- mock data ---------- */

interface CounterGoal {
  id: string;
  name: string;
  monthlyTarget: number;
  unit: string;
}

const COUNTER_GOALS: CounterGoal[] = [
  { id: "gym", name: "Gym Sessions", monthlyTarget: 15, unit: "sessions" },
  { id: "steps", name: "Steps (avg)", monthlyTarget: 8500, unit: "steps" },
];

const INITIAL_COUNTS: Record<string, number> = {
  gym: 8,
  steps: 7200,
};

const NET_WORTH_DATA = [
  { year: "2021", value: 21070 },
  { year: "2022", value: 27992 },
  { year: "2023", value: 32766 },
  { year: "2024", value: 80711 },
  { year: "2025", value: 86811 },
];

const GOAL_CATEGORIES = [
  { label: "Long-Range Dreams", achieved: 1, total: 3, color: "text-pixel-purple" },
  { label: "Economic", achieved: 2, total: 4, color: "text-pixel-gold" },
  { label: "Things I Want", achieved: 3, total: 5, color: "text-pixel-cyan" },
  { label: "Personal Dev", achieved: 4, total: 6, color: "text-pixel-green" },
];

/* ---------- helpers ---------- */

function overallCompletion(
  counts: Record<string, number>,
  goals: CounterGoal[],
) {
  let sum = 0;
  let total = 0;
  goals.forEach((g) => {
    sum += Math.min(counts[g.id] / g.monthlyTarget, 1);
    total += 1;
  });
  GOAL_CATEGORIES.forEach((c) => {
    sum += c.achieved / c.total;
    total += 1;
  });
  return total === 0 ? 0 : sum / total;
}

/* ---------- component ---------- */

export default function DashboardPage() {
  const [counts, setCounts] = useState<Record<string, number>>(INITIAL_COUNTS);

  const increment = (id: string, step: number) => {
    playCounterClick();
    setCounts((prev) => {
      const next = { ...prev, [id]: prev[id] + step };
      const goal = COUNTER_GOALS.find((g) => g.id === id);
      if (goal && next[id] >= goal.monthlyTarget) {
        setTimeout(() => playSuccess(), 200);
      }
      return next;
    });
  };

  const pct = overallCompletion(counts, COUNTER_GOALS);
  const pctDisplay = Math.round(pct * 100);
  const badge = getMonthlyBadge(pct);

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6">
      {/* Page title */}
      <h2 className="font-pixel text-xs text-pixel-cyan mb-0">
        MISSION CONTROL
      </h2>

      {/* ===== Quick Counters ===== */}
      <section className="flex flex-col gap-4">
        <h3 className="font-pixel text-[10px] text-pixel-green">
          QUICK COUNTERS
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {COUNTER_GOALS.map((goal) => {
            const current = counts[goal.id];
            const done = current >= goal.monthlyTarget;
            return (
              <div
                key={goal.id}
                className="pixel-card p-4 flex items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-pixel text-[10px] text-pixel-cyan truncate">
                    {goal.name.toUpperCase()}
                  </p>
                  <p className="font-pixel-body text-lg text-white mt-1">
                    {current.toLocaleString()}{" "}
                    <span className="text-gray-500">
                      / {goal.monthlyTarget.toLocaleString()} {goal.unit}
                    </span>
                  </p>
                  {/* mini progress */}
                  <div className="pixel-progress mt-2 h-3">
                    <div
                      className={`pixel-progress-fill ${done ? "bg-pixel-gold" : "bg-pixel-green"}`}
                      style={{
                        width: `${Math.min((current / goal.monthlyTarget) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>

                <button
                  onClick={() => increment(goal.id, goal.id === "steps" ? 100 : 1)}
                  className="pixel-btn pixel-btn-green w-12 h-12 flex items-center justify-center text-2xl shrink-0"
                  aria-label={`Increment ${goal.name}`}
                >
                  +
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* ===== Monthly Progress ===== */}
      <section className="pixel-card p-4">
        <h3 className="font-pixel text-[10px] text-pixel-purple mb-3">
          MONTHLY PROGRESS
        </h3>
        <div className="flex items-center gap-3">
          <div className="pixel-progress flex-1">
            <div
              className="pixel-progress-fill bg-pixel-purple"
              style={{ width: `${pctDisplay}%` }}
            />
          </div>
          <span className="font-pixel text-[10px] text-pixel-purple whitespace-nowrap">
            {pctDisplay}%
          </span>
        </div>
      </section>

      {/* ===== Net Worth Chart ===== */}
      <section className="pixel-card p-4">
        <h3 className="font-pixel text-[10px] text-pixel-gold mb-4">
          NET WORTH
        </h3>
        <div className="w-full h-48 sm:h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={NET_WORTH_DATA}>
              <XAxis
                dataKey="year"
                tick={{ fill: "#888", fontFamily: "VT323, monospace", fontSize: 14 }}
                axisLine={{ stroke: "#2a2a4a" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#888", fontFamily: "VT323, monospace", fontSize: 14 }}
                axisLine={{ stroke: "#2a2a4a" }}
                tickLine={false}
                tickFormatter={(v: number) =>
                  v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)
                }
                width={40}
              />
              <Tooltip
                contentStyle={{
                  background: "#0f0f2a",
                  border: "2px solid #ffd700",
                  fontFamily: "VT323, monospace",
                  fontSize: 16,
                  color: "#ffd700",
                }}
                formatter={(value) => [
                  `$${Number(value).toLocaleString()}`,
                  "Net Worth",
                ]}
                labelStyle={{ color: "#888" }}
              />
              <Line
                type="stepAfter"
                dataKey="value"
                stroke="#ffd700"
                strokeWidth={3}
                dot={{
                  fill: "#ffd700",
                  stroke: "#0f0f2a",
                  strokeWidth: 2,
                  r: 5,
                }}
                activeDot={{ r: 7, fill: "#ffd700", stroke: "#fff" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ===== Goal Status Cards ===== */}
      <section>
        <h3 className="font-pixel text-[10px] text-pixel-cyan mb-3">
          GOAL STATUS
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {GOAL_CATEGORIES.map((cat) => (
            <div key={cat.label} className="pixel-card p-3 text-center">
              <p className={`font-pixel text-[8px] ${cat.color} leading-relaxed`}>
                {cat.label.toUpperCase()}
              </p>
              <p className="font-pixel-body text-2xl text-white mt-2">
                {cat.achieved}
                <span className="text-gray-500"> / {cat.total}</span>
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Current Badge ===== */}
      <section className="pixel-card p-4 flex items-center gap-4">
        <div
          className={`w-14 h-14 flex items-center justify-center bg-gradient-to-br ${getBadgeGradient(badge.level)} shrink-0`}
        >
          <span className="text-2xl">{badge.emoji}</span>
        </div>
        <div>
          <p className="font-pixel text-[10px] text-pixel-gold">
            CURRENT BADGE
          </p>
          <p className="font-pixel-body text-lg text-white mt-1">
            {badge.name}
          </p>
          <p className="font-pixel-body text-sm text-gray-500">
            {pctDisplay}% monthly completion
          </p>
        </div>
      </section>
    </div>
  );
}
