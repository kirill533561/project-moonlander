"use client";

import { useState } from "react";
import { useLocalStorage } from "@/lib/use-local-storage";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { useDemoMode } from "@/components/layout/header";
import { DEMO_COUNTERS, DEMO_COUNTER_VALUES, DEMO_NET_WORTH, DEMO_GOAL_CATEGORIES } from "@/lib/demo-data";

/* ---------- types ---------- */

interface CounterGoal {
  id: string;
  name: string;
  monthlyTarget: number;
  step: number;
  unit: string;
}

/* ---------- component ---------- */

export default function DashboardPage() {
  const { demoMode } = useDemoMode();

  const [counters, setCounters] = useLocalStorage<CounterGoal[]>("ml-dash-counters", []);
  const [counts, setCounts] = useLocalStorage<Record<string, number>>("ml-dash-counts", {});

  const [newName, setNewName] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [newStep, setNewStep] = useState("1");
  const [newUnit, setNewUnit] = useState("times");

  const demoCountersTyped: CounterGoal[] = DEMO_COUNTERS;
  const activeCounters = demoMode ? demoCountersTyped : counters;
  const activeCounts = demoMode ? DEMO_COUNTER_VALUES : counts;
  const activeNetWorth = demoMode ? DEMO_NET_WORTH : [];
  const activeGoalCats = demoMode ? DEMO_GOAL_CATEGORIES : [];

  const increment = (id: string, step: number) => {
    playCounterClick();
    setCounts((prev) => {
      const next = { ...prev, [id]: (prev[id] ?? 0) + step };
      const goal = activeCounters.find((g) => g.id === id);
      if (goal && next[id] >= goal.monthlyTarget && (prev[id] ?? 0) < goal.monthlyTarget) {
        setTimeout(() => playSuccess(), 200);
      }
      return next;
    });
  };

  const decrement = (id: string, step: number) => {
    setCounts((prev) => {
      const val = (prev[id] ?? 0) - step;
      return { ...prev, [id]: Math.max(0, val) };
    });
  };

  const addCounter = () => {
    if (!newName.trim() || !newTarget) return;
    const id = Math.random().toString(36).slice(2, 9);
    setCounters((prev) => [
      ...prev,
      { id, name: newName.trim(), monthlyTarget: Number(newTarget), step: Number(newStep) || 1, unit: newUnit || "times" },
    ]);
    setCounts((prev) => ({ ...prev, [id]: 0 }));
    setNewName("");
    setNewTarget("");
    setNewStep("1");
    setNewUnit("times");
  };

  const deleteCounter = (id: string) => {
    setCounters((prev) => prev.filter((c) => c.id !== id));
    setCounts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const pct = activeCounters.length > 0
    ? activeCounters.reduce((sum, g) => sum + Math.min((activeCounts[g.id] ?? 0) / g.monthlyTarget, 1), 0) / activeCounters.length
    : 0;
  const pctDisplay = Math.round(pct * 100);
  const badge = getMonthlyBadge(pct);

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6">
      <h2 className="font-pixel text-sm text-pixel-cyan">MISSION CONTROL</h2>

      {/* ===== Quick Counters ===== */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-pixel text-xs text-pixel-green">QUICK COUNTERS</h3>
          <Dialog>
            <DialogTrigger className="pixel-btn pixel-btn-green text-base px-3 py-2">
              + ADD
            </DialogTrigger>
            <DialogContent className="bg-[#0f0f2a] border-2 border-[#2a2a4a] max-w-sm">
              <DialogHeader>
                <DialogTitle className="font-pixel text-xs text-pixel-green">NEW COUNTER</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-3 mt-2">
                <input
                  placeholder="Counter name..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="bg-[#1a1a3a] border-2 border-[#2a2a4a] text-white font-pixel-body text-lg px-3 py-2 w-full focus:border-pixel-cyan focus:outline-none"
                />
                <input
                  type="number"
                  placeholder="Monthly target..."
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                  className="bg-[#1a1a3a] border-2 border-[#2a2a4a] text-white font-pixel-body text-lg px-3 py-2 w-full focus:border-pixel-cyan focus:outline-none"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    placeholder="Step (e.g. 1)"
                    value={newStep}
                    onChange={(e) => setNewStep(e.target.value)}
                    className="bg-[#1a1a3a] border-2 border-[#2a2a4a] text-white font-pixel-body text-lg px-3 py-2 w-full focus:border-pixel-cyan focus:outline-none"
                  />
                  <input
                    placeholder="Unit (e.g. sessions)"
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="bg-[#1a1a3a] border-2 border-[#2a2a4a] text-white font-pixel-body text-lg px-3 py-2 w-full focus:border-pixel-cyan focus:outline-none"
                  />
                </div>
                <DialogClose onClick={addCounter} className="pixel-btn pixel-btn-green py-3 text-lg w-full">
                  CREATE COUNTER
                </DialogClose>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {activeCounters.length === 0 && (
          <div className="pixel-card p-8 text-center">
            <p className="font-pixel-body text-xl text-gray-500">No counters yet</p>
            <p className="font-pixel-body text-base text-gray-600 mt-2">
              Tap + ADD to create your first quick counter
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {activeCounters.map((goal) => {
            const current = activeCounts[goal.id] ?? 0;
            const done = current >= goal.monthlyTarget;
            return (
              <div key={goal.id} className="pixel-card p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="font-pixel text-[10px] text-pixel-cyan truncate">
                    {goal.name.toUpperCase()}
                  </p>
                  {!demoMode && (
                    <button
                      onClick={() => deleteCounter(goal.id)}
                      className="font-pixel-body text-lg text-pixel-red hover:text-red-300 px-1"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <p className="font-pixel-body text-2xl text-white">
                  {current.toLocaleString()}{" "}
                  <span className="text-gray-500">
                    / {goal.monthlyTarget.toLocaleString()} {goal.unit}
                  </span>
                </p>
                <div className="pixel-progress h-4">
                  <div
                    className={`pixel-progress-fill ${done ? "bg-pixel-gold" : "bg-pixel-green"}`}
                    style={{ width: `${Math.min((current / goal.monthlyTarget) * 100, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-center gap-4 mt-1">
                  <button
                    onClick={() => decrement(goal.id, goal.step)}
                    className="pixel-btn w-14 h-14 flex items-center justify-center text-3xl"
                  >
                    -
                  </button>
                  <span className="font-pixel-body text-3xl text-white min-w-[60px] text-center">
                    {current}
                  </span>
                  <button
                    onClick={() => increment(goal.id, goal.step)}
                    className="pixel-btn pixel-btn-green w-14 h-14 flex items-center justify-center text-3xl"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ===== Monthly Progress ===== */}
      {activeCounters.length > 0 && (
        <section className="pixel-card p-4">
          <h3 className="font-pixel text-xs text-pixel-purple mb-3">MONTHLY PROGRESS</h3>
          <div className="flex items-center gap-3">
            <div className="pixel-progress flex-1">
              <div className="pixel-progress-fill bg-pixel-purple" style={{ width: `${pctDisplay}%` }} />
            </div>
            <span className="font-pixel text-xs text-pixel-purple whitespace-nowrap">{pctDisplay}%</span>
          </div>
        </section>
      )}

      {/* ===== Net Worth Chart (demo only) ===== */}
      {activeNetWorth.length > 0 && (
        <section className="pixel-card p-4">
          <h3 className="font-pixel text-xs text-pixel-gold mb-4">NET WORTH</h3>
          <div className="w-full h-48 sm:h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activeNetWorth}>
                <XAxis
                  dataKey="year"
                  tick={{ fill: "#888", fontFamily: "VT323, monospace", fontSize: 16 }}
                  axisLine={{ stroke: "#2a2a4a" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#888", fontFamily: "VT323, monospace", fontSize: 16 }}
                  axisLine={{ stroke: "#2a2a4a" }}
                  tickLine={false}
                  tickFormatter={(v: number) => v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)}
                  width={40}
                />
                <Tooltip
                  contentStyle={{ background: "#0f0f2a", border: "2px solid #ffd700", fontFamily: "VT323, monospace", fontSize: 18, color: "#ffd700" }}
                  formatter={(value) => [`$${Number(value).toLocaleString()}`, "Net Worth"]}
                  labelStyle={{ color: "#888" }}
                />
                <Line type="stepAfter" dataKey="value" stroke="#ffd700" strokeWidth={3}
                  dot={{ fill: "#ffd700", stroke: "#0f0f2a", strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7, fill: "#ffd700", stroke: "#fff" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* ===== Goal Status Cards (demo only) ===== */}
      {activeGoalCats.length > 0 && (
        <section>
          <h3 className="font-pixel text-xs text-pixel-cyan mb-3">GOAL STATUS</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {activeGoalCats.map((cat) => (
              <div key={cat.label} className="pixel-card p-3 text-center">
                <p className={`font-pixel text-[9px] ${cat.color} leading-relaxed`}>{cat.label.toUpperCase()}</p>
                <p className="font-pixel-body text-3xl text-white mt-2">
                  {cat.achieved}<span className="text-gray-500"> / {cat.total}</span>
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ===== Current Badge ===== */}
      {activeCounters.length > 0 && (
        <section className="pixel-card p-4 flex items-center gap-4">
          <div className={`w-16 h-16 flex items-center justify-center bg-gradient-to-br ${getBadgeGradient(badge.level)} shrink-0`}>
            <span className="text-3xl">{badge.emoji}</span>
          </div>
          <div>
            <p className="font-pixel text-xs text-pixel-gold">CURRENT BADGE</p>
            <p className="font-pixel-body text-xl text-white mt-1">{badge.name}</p>
            <p className="font-pixel-body text-base text-gray-500">{pctDisplay}% monthly completion</p>
          </div>
        </section>
      )}
    </div>
  );
}
