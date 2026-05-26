"use client";

import { useState, useMemo } from "react";
import { useLocalStorage } from "@/lib/use-local-storage";
import { playCounterClick, playSuccess } from "@/lib/sounds";
import { getMonthlyBadge, getBadgeGradient } from "@/lib/rewards";
import { useDemoMode } from "@/components/layout/header";
import { DEMO_COUNTERS, DEMO_COUNTER_VALUES, DEMO_NET_WORTH, DEMO_GOAL_CATEGORIES } from "@/lib/demo-data";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose,
} from "@/components/ui/dialog";
import { RangeSlider } from "@/components/range-slider";

interface CounterGoal {
  id: string;
  name: string;
  monthlyTarget: number;
  step: number;
  unit: string;
}

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function DashboardPage() {
  const { demoMode } = useDemoMode();
  const [counters, setCounters] = useLocalStorage<CounterGoal[]>("ml-dash-counters", []);
  const [counts, setCounts] = useLocalStorage<Record<string, number>>("ml-dash-counts", {});
  const [newName, setNewName] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [newStep, setNewStep] = useState("1");
  const [newUnit, setNewUnit] = useState("times");

  const [financeData] = useLocalStorage<Record<number, Record<number, Record<string, Record<string, number>>>>>("ml-finance-data", {});
  const [financeVars] = useLocalStorage<{ id: string; name: string; type: string; fields: string[] }[]>("ml-finance-vars", []);
  const [dreams] = useLocalStorage<{ id: string; name: string; achieved: boolean; target?: number | null; current?: number | null }[]>("ml-goals-dreams", []);

  // Global date range (as month index: year*12+month)
  const [rangeMin, setRangeMin] = useState(0);
  const [rangeMax, setRangeMax] = useState(0);
  const [rangeInit, setRangeInit] = useState(false);

  const demoCountersTyped: CounterGoal[] = DEMO_COUNTERS;
  const activeCounters = demoMode ? demoCountersTyped : counters;
  const activeCounts = demoMode ? DEMO_COUNTER_VALUES : counts;

  // Compute all finance metrics
  const metrics = useMemo(() => {
    const yearly: Record<number, { salary: number; expenses: number; investments: number }> = {};
    const monthly: { month: string; salary: number; expenses: number; net: number; cumulative: number }[] = [];

    for (const [yearStr, yearData] of Object.entries(financeData)) {
      const year = Number(yearStr);
      if (!yearly[year]) yearly[year] = { salary: 0, expenses: 0, investments: 0 };
      for (const [, monthData] of Object.entries(yearData)) {
        for (const [varId, fields] of Object.entries(monthData)) {
          const v = financeVars.find((fv) => fv.id === varId);
          if (!v) continue;
          const amt = fields.amount ?? 0;
          if (v.type === "income_source") yearly[year].salary += amt;
          else if (v.type === "expense_category") yearly[year].expenses += amt;
          else if (v.type === "investment_account" || v.type === "bank_account") yearly[year].investments += amt;
        }
      }
    }

    const allYears = Object.keys(financeData).map(Number).sort();

    // Build full monthly timeline (for range slider)
    const allMonthsFlat: { idx: number; year: number; month: number; salary: number; expenses: number; net: number }[] = [];
    for (const yr of allYears) {
      const yd = financeData[yr];
      if (!yd) continue;
      for (let m = 0; m < 12; m++) {
        const md = yd[m];
        if (!md) continue;
        let salary = 0, expenses = 0;
        for (const [varId, fields] of Object.entries(md)) {
          const v = financeVars.find((fv) => fv.id === varId);
          if (!v) continue;
          if (v.type === "income_source") salary += fields.amount ?? 0;
          else if (v.type === "expense_category") expenses += fields.amount ?? 0;
        }
        if (salary > 0 || expenses > 0) {
          allMonthsFlat.push({ idx: yr * 12 + m, year: yr, month: m, salary: Math.round(salary), expenses: Math.round(expenses), net: Math.round(salary - expenses) });
        }
      }
    }
    const minIdx = allMonthsFlat.length > 0 ? allMonthsFlat[0].idx : 0;
    const maxIdx = allMonthsFlat.length > 0 ? allMonthsFlat[allMonthsFlat.length - 1].idx : 0;

    const yearlyChart = Object.entries(yearly)
      .sort(([a], [b]) => Number(a) - Number(b))
      .filter(([, v]) => v.salary > 0 || v.expenses > 0)
      .map(([year, v]) => ({ year, salary: Math.round(v.salary), expenses: Math.round(v.expenses), net: Math.round(v.salary - v.expenses), savings: Math.round(v.salary - v.expenses) }));

    const currentYear = new Date().getFullYear();
    const cy = yearly[currentYear] || { salary: 0, expenses: 0, investments: 0 };
    const prevYear = yearly[currentYear - 1] || { salary: 0, expenses: 0, investments: 0 };
    const savingsRate = cy.salary > 0 ? ((cy.salary - cy.expenses) / cy.salary * 100) : 0;

    const getMonthlyForYear = (yr: number) => {
      const yd = financeData[yr];
      const result: typeof monthly = [];
      let cum = 0;
      if (yd) {
        for (let i = 0; i < 12; i++) {
          const md = yd[i];
          let salary = 0, expenses = 0;
          if (md) {
            for (const [varId, fields] of Object.entries(md)) {
              const v = financeVars.find((fv) => fv.id === varId);
              if (!v) continue;
              if (v.type === "income_source") salary += fields.amount ?? 0;
              else if (v.type === "expense_category") expenses += fields.amount ?? 0;
            }
          }
          if (salary > 0 || expenses > 0) {
            cum += salary - expenses;
            result.push({ month: MONTHS_SHORT[i], salary: Math.round(salary), expenses: Math.round(expenses), net: Math.round(salary - expenses), cumulative: Math.round(cum) });
          }
        }
      }
      return result;
    };

    const defaultMonthly = getMonthlyForYear(currentYear);
    const bestMonth = defaultMonthly.length > 0 ? defaultMonthly.reduce((a, b) => a.net > b.net ? a : b) : null;
    const worstMonth = defaultMonthly.length > 0 ? defaultMonthly.reduce((a, b) => a.net < b.net ? a : b) : null;
    const avgExpense = defaultMonthly.length > 0 ? Math.round(defaultMonthly.reduce((s, m) => s + m.expenses, 0) / defaultMonthly.length) : 0;

    return { yearly, yearlyChart, monthly: defaultMonthly, currentYear: cy, prevYear, savingsRate, bestMonth, worstMonth, avgExpense, currentYearNum: currentYear, allYears, getMonthlyForYear, allMonthsFlat, minIdx, maxIdx };
  }, [financeData, financeVars]);

  // Initialize range to full data extent
  if (!rangeInit && metrics.minIdx > 0) {
    setRangeMin(metrics.minIdx);
    setRangeMax(metrics.maxIdx);
    setRangeInit(true);
  }

  const effectiveMin = rangeInit ? rangeMin : metrics.minIdx;
  const effectiveMax = rangeInit ? rangeMax : metrics.maxIdx;

  // Filter data by range
  const filteredMonths = useMemo(() => {
    return metrics.allMonthsFlat.filter((m) => m.idx >= effectiveMin && m.idx <= effectiveMax);
  }, [metrics.allMonthsFlat, effectiveMin, effectiveMax]);

  const filteredMonthlyChart = useMemo(() => {
    let cum = 0;
    return filteredMonths.map((m) => {
      cum += m.net;
      return { month: `${MONTHS_SHORT[m.month]} ${String(m.year).slice(2)}`, salary: m.salary, expenses: m.expenses, net: m.net, cumulative: cum };
    });
  }, [filteredMonths]);

  const filteredYearlyChart = useMemo(() => {
    const yearly: Record<number, { salary: number; expenses: number; net: number }> = {};
    for (const m of filteredMonths) {
      if (!yearly[m.year]) yearly[m.year] = { salary: 0, expenses: 0, net: 0 };
      yearly[m.year].salary += m.salary;
      yearly[m.year].expenses += m.expenses;
      yearly[m.year].net += m.net;
    }
    return Object.entries(yearly).sort(([a], [b]) => Number(a) - Number(b)).map(([year, v]) => ({ year, ...v }));
  }, [filteredMonths]);

  const filteredStats = useMemo(() => {
    const totalSalary = filteredMonths.reduce((s, m) => s + m.salary, 0);
    const totalExpenses = filteredMonths.reduce((s, m) => s + m.expenses, 0);
    const savingsRate = totalSalary > 0 ? ((totalSalary - totalExpenses) / totalSalary) * 100 : 0;
    const best = filteredMonths.length > 0 ? filteredMonths.reduce((a, b) => a.net > b.net ? a : b) : null;
    const worst = filteredMonths.length > 0 ? filteredMonths.reduce((a, b) => a.net < b.net ? a : b) : null;
    const avgExp = filteredMonths.length > 0 ? Math.round(totalExpenses / filteredMonths.length) : 0;
    return { totalSalary, totalExpenses, savingsRate, best, worst, avgExp };
  }, [filteredMonths]);

  const formatMonthIdx = (idx: number) => {
    const year = Math.floor(idx / 12);
    const month = idx % 12;
    return `${MONTHS_SHORT[month]} ${year}`;
  };

  const hasFinanceData = metrics.allMonthsFlat.length > 0;
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);

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
    setCounts((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] ?? 0) - step) }));
  };
  const addCounter = () => {
    if (!newName.trim() || !newTarget) return;
    const id = Math.random().toString(36).slice(2, 9);
    setCounters((prev) => [...prev, { id, name: newName.trim(), monthlyTarget: Number(newTarget), step: Number(newStep) || 1, unit: newUnit || "times" }]);
    setCounts((prev) => ({ ...prev, [id]: 0 }));
    setNewName(""); setNewTarget(""); setNewStep("1"); setNewUnit("times");
  };
  const deleteCounter = (id: string) => {
    setCounters((prev) => prev.filter((c) => c.id !== id));
    setCounts((prev) => { const n = { ...prev }; delete n[id]; return n; });
  };

  const pct = activeCounters.length > 0
    ? activeCounters.reduce((sum, g) => sum + Math.min((activeCounts[g.id] ?? 0) / g.monthlyTarget, 1), 0) / activeCounters.length : 0;
  const badge = getMonthlyBadge(pct);

  const tooltipStyle = { background: "#0f0f2a", border: "2px solid #2a2a4a", fontFamily: "VT323, monospace", fontSize: 16, color: "#fff" };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-4">

      {/* ===== MISSION STATUS HEADER ===== */}
      <div className="pixel-card p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="font-pixel text-sm text-pixel-cyan">MISSION CONTROL</p>
            <p className="font-pixel-body text-lg text-gray-400">
              MISSION DAY {dayOfYear} / 365 &mdash; {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`w-14 h-14 flex items-center justify-center bg-gradient-to-br ${getBadgeGradient(badge.level)}`}>
              <span className="text-2xl">{badge.emoji}</span>
            </div>
            <div>
              <p className="font-pixel text-[9px] text-pixel-gold">{badge.name.toUpperCase()}</p>
              <p className="font-pixel-body text-base text-gray-500">{Math.round(pct * 100)}% complete</p>
            </div>
          </div>
        </div>
        {/* Mission day progress bar */}
        <div className="pixel-progress mt-3 h-3">
          <div className="pixel-progress-fill bg-pixel-cyan" style={{ width: `${(dayOfYear / 365) * 100}%` }} />
        </div>
        <div className="flex justify-between font-pixel-body text-xs text-gray-600 mt-1">
          <span>JAN 1</span>
          <span>DEC 31</span>
        </div>
      </div>

      {/* ===== INSPIRING QUOTE ===== */}
      <div className="pixel-card p-4 text-center overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-pixel-purple/5 to-transparent animate-pulse" />
        <p className="font-pixel text-[9px] text-pixel-purple/80 leading-relaxed relative">
          &quot;DISCIPLINE IS CHOOSING BETWEEN WHAT YOU WANT NOW
          <br className="hidden sm:block" />{" "}
          AND WHAT YOU WANT MOST.&quot;
        </p>
      </div>

      {/* ===== QUICK COUNTERS (TOP PRIORITY) ===== */}
      <div className="pixel-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-pixel text-xs text-pixel-green">QUICK COUNTERS</h3>
          <Dialog>
            <DialogTrigger className="pixel-btn pixel-btn-green text-base px-3 py-1">+ ADD</DialogTrigger>
            <DialogContent className="bg-[#0f0f2a] border-2 border-[#2a2a4a] max-w-sm">
              <DialogHeader>
                <DialogTitle className="font-pixel text-xs text-pixel-green">NEW COUNTER</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-3 mt-2">
                <input placeholder="Counter name..." value={newName} onChange={(e) => setNewName(e.target.value)}
                  className="bg-[#1a1a3a] border-2 border-[#2a2a4a] text-white font-pixel-body text-lg px-3 py-2 w-full focus:border-pixel-cyan focus:outline-none" />
                <input type="number" placeholder="Monthly target..." value={newTarget} onChange={(e) => setNewTarget(e.target.value)}
                  className="bg-[#1a1a3a] border-2 border-[#2a2a4a] text-white font-pixel-body text-lg px-3 py-2 w-full focus:border-pixel-cyan focus:outline-none" />
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" placeholder="Step (e.g. 1)" value={newStep} onChange={(e) => setNewStep(e.target.value)}
                    className="bg-[#1a1a3a] border-2 border-[#2a2a4a] text-white font-pixel-body text-lg px-3 py-2 w-full focus:border-pixel-cyan focus:outline-none" />
                  <input placeholder="Unit" value={newUnit} onChange={(e) => setNewUnit(e.target.value)}
                    className="bg-[#1a1a3a] border-2 border-[#2a2a4a] text-white font-pixel-body text-lg px-3 py-2 w-full focus:border-pixel-cyan focus:outline-none" />
                </div>
                <DialogClose onClick={addCounter} className="pixel-btn pixel-btn-green py-3 text-lg w-full">CREATE COUNTER</DialogClose>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        {activeCounters.length === 0 ? (
          <p className="font-pixel-body text-lg text-gray-500 text-center py-4">No counters yet — tap + ADD</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeCounters.map((goal) => {
              const current = activeCounts[goal.id] ?? 0;
              const done = current >= goal.monthlyTarget;
              return (
                <div key={goal.id} className="bg-[#1a1a3a] border border-[#2a2a4a] p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <p className="font-pixel text-[9px] text-pixel-cyan truncate">{goal.name.toUpperCase()}</p>
                    {!demoMode && (
                      <button onClick={() => deleteCounter(goal.id)} className="font-pixel-body text-base text-pixel-red px-1">✕</button>
                    )}
                  </div>
                  <div className="pixel-progress h-3">
                    <div className={`pixel-progress-fill ${done ? "bg-pixel-gold" : "bg-pixel-green"}`}
                      style={{ width: `${Math.min((current / goal.monthlyTarget) * 100, 100)}%` }} />
                  </div>
                  <div className="flex items-center justify-center gap-4">
                    <button onClick={() => decrement(goal.id, goal.step)} className="pixel-btn w-12 h-12 flex items-center justify-center text-2xl">-</button>
                    <div className="text-center">
                      <span className="font-pixel-body text-3xl text-white">{current}</span>
                      <span className="font-pixel-body text-lg text-gray-500"> / {goal.monthlyTarget}</span>
                    </div>
                    <button onClick={() => increment(goal.id, goal.step)} className="pixel-btn pixel-btn-green w-12 h-12 flex items-center justify-center text-2xl">+</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ===== LONG-RANGE DREAMS OVERVIEW ===== */}
      {dreams.length > 0 && (
        <div className="pixel-card p-4">
          <h3 className="font-pixel text-xs text-pixel-purple mb-3">LONG-RANGE DREAMS</h3>
          <div className="flex flex-col gap-2">
            {dreams.map((dream) => {
              const hasTarget = dream.target != null && dream.target > 0;
              const pct = hasTarget ? Math.min(((dream.current ?? 0) / dream.target!) * 100, 100) : 0;
              return (
                <div key={dream.id} className="flex flex-col gap-1 py-1">
                  <div className="flex items-center gap-3">
                    <span className={`text-xl ${dream.achieved ? "text-pixel-green" : hasTarget ? "text-pixel-purple/60" : "text-pixel-purple/60"}`}>
                      {dream.achieved ? "★" : hasTarget ? "🎯" : "☆"}
                    </span>
                    <span className={`font-pixel-body text-lg flex-1 ${dream.achieved ? "text-pixel-green" : "text-gray-300"}`}>
                      {dream.name}
                    </span>
                    {hasTarget && (
                      <span className="font-pixel-body text-base text-gray-500">
                        {(dream.current ?? 0).toLocaleString()} / {dream.target!.toLocaleString()}
                      </span>
                    )}
                  </div>
                  {hasTarget && (
                    <div className="pixel-progress h-2 ml-9">
                      <div className={`pixel-progress-fill ${pct >= 100 ? "bg-pixel-green" : "bg-pixel-purple"}`} style={{ width: `${pct}%` }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-3 pt-3 border-t border-[#2a2a4a] flex items-center justify-between">
            <span className="font-pixel-body text-base text-gray-500">
              {dreams.filter((d) => d.achieved).length} / {dreams.length} achieved
            </span>
            <div className="pixel-progress flex-1 ml-3 h-3">
              <div className="pixel-progress-fill bg-pixel-purple" style={{ width: `${dreams.length > 0 ? (dreams.filter((d) => d.achieved).length / dreams.length) * 100 : 0}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* ===== DATE RANGE SLIDER ===== */}
      {hasFinanceData && (
        <div className="pixel-card p-4">
          <h3 className="font-pixel text-[9px] text-gray-500 mb-2">DATE RANGE</h3>
          <RangeSlider
            min={metrics.minIdx}
            max={metrics.maxIdx}
            valueMin={effectiveMin}
            valueMax={effectiveMax}
            onChange={(newMin, newMax) => { setRangeMin(newMin); setRangeMax(newMax); setRangeInit(true); }}
            formatLabel={formatMonthIdx}
            color="#00ffff"
          />
          <p className="font-pixel-body text-sm text-gray-600 mt-1 text-center">
            {filteredMonths.length} months selected
          </p>
        </div>
      )}

      {/* ===== TELEMETRY TILES ===== */}
      {hasFinanceData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="pixel-card p-3">
            <p className="font-pixel text-[8px] text-pixel-green">TOTAL INCOME</p>
            <p className="font-pixel-body text-2xl text-pixel-green mt-1">
              €{filteredStats.totalSalary.toLocaleString("en", { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="pixel-card p-3">
            <p className="font-pixel text-[8px] text-pixel-red">TOTAL EXPENSES</p>
            <p className="font-pixel-body text-2xl text-pixel-red mt-1">
              €{filteredStats.totalExpenses.toLocaleString("en", { maximumFractionDigits: 0 })}
            </p>
            <p className="font-pixel-body text-xs text-gray-500 mt-1">
              avg €{filteredStats.avgExp.toLocaleString()}/mo
            </p>
          </div>
          <div className="pixel-card p-3">
            <p className="font-pixel text-[8px] text-pixel-gold">SAVINGS RATE</p>
            <p className={`font-pixel-body text-2xl mt-1 ${filteredStats.savingsRate >= 0 ? "text-pixel-gold" : "text-pixel-red"}`}>
              {filteredStats.savingsRate.toFixed(1)}%
            </p>
            <div className="pixel-progress mt-2 h-2">
              <div className="pixel-progress-fill bg-pixel-gold" style={{ width: `${Math.max(0, Math.min(filteredStats.savingsRate, 100))}%` }} />
            </div>
          </div>
          <div className="pixel-card p-3">
            <p className="font-pixel text-[8px] text-pixel-cyan">NET INCOME</p>
            <p className={`font-pixel-body text-2xl mt-1 ${filteredStats.totalSalary - filteredStats.totalExpenses >= 0 ? "text-pixel-green" : "text-pixel-red"}`}>
              €{(filteredStats.totalSalary - filteredStats.totalExpenses).toLocaleString("en", { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      )}

      {/* ===== BEST / WORST MONTH ALERTS ===== */}
      {filteredStats.best && filteredStats.worst && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="pixel-card p-3 border-l-4 border-pixel-green">
            <p className="font-pixel text-[8px] text-pixel-green">BEST MONTH</p>
            <p className="font-pixel-body text-xl text-white">
              {MONTHS_SHORT[filteredStats.best.month]} {filteredStats.best.year} &mdash; <span className="text-pixel-green">+€{filteredStats.best.net.toLocaleString()}</span>
            </p>
          </div>
          <div className="pixel-card p-3 border-l-4 border-pixel-red">
            <p className="font-pixel text-[8px] text-pixel-red">WORST MONTH</p>
            <p className="font-pixel-body text-xl text-white">
              {MONTHS_SHORT[filteredStats.worst.month]} {filteredStats.worst.year} &mdash; <span className="text-pixel-red">{filteredStats.worst.net >= 0 ? "+" : ""}€{filteredStats.worst.net.toLocaleString()}</span>
            </p>
          </div>
        </div>
      )}

      {/* ===== CASH FLOW TRAJECTORY ===== */}
      {filteredMonthlyChart.length > 0 && (
        <div className="pixel-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-pixel text-xs text-pixel-cyan">CASH FLOW TRAJECTORY</h3>
            <span className={`font-pixel text-xs ${filteredMonthlyChart[filteredMonthlyChart.length - 1].cumulative >= 0 ? "text-pixel-green" : "text-pixel-red"}`}>
              €{filteredMonthlyChart[filteredMonthlyChart.length - 1].cumulative.toLocaleString()}
            </span>
          </div>
          <div className="w-full h-44 sm:h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredMonthlyChart}>
                <defs>
                  <linearGradient id="cashGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00ffff" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#00ffff" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#2a2a4a" strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fill: "#888", fontFamily: "VT323, monospace", fontSize: 14 }} axisLine={{ stroke: "#2a2a4a" }} tickLine={false} interval={Math.max(0, Math.floor(filteredMonthlyChart.length / 12))} />
                <YAxis tick={{ fill: "#888", fontFamily: "VT323, monospace", fontSize: 14 }} axisLine={{ stroke: "#2a2a4a" }} tickLine={false}
                  tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v <= -1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} width={45} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`€${Number(value).toLocaleString()}`, "Cumulative"]} labelStyle={{ color: "#888" }} />
                <Area type="monotone" dataKey="cumulative" stroke="#00ffff" strokeWidth={2} fill="url(#cashGrad)" dot={filteredMonthlyChart.length <= 24 ? { fill: "#00ffff", r: 3 } : false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ===== MONTHLY SIGNAL READOUT (salary vs expenses) ===== */}
      {filteredMonthlyChart.length > 0 && (
        <div className="pixel-card p-4">
          <h3 className="font-pixel text-xs text-pixel-gold mb-3">MONTHLY SIGNAL</h3>
          <div className="w-full h-48 sm:h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredMonthlyChart} barGap={1} barSize={Math.max(4, Math.min(20, 400 / filteredMonthlyChart.length))}>
                <CartesianGrid stroke="#2a2a4a" strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fill: "#888", fontFamily: "VT323, monospace", fontSize: 12 }} axisLine={{ stroke: "#2a2a4a" }} tickLine={false} interval={Math.max(0, Math.floor(filteredMonthlyChart.length / 12))} />
                <YAxis tick={{ fill: "#888", fontFamily: "VT323, monospace", fontSize: 14 }} axisLine={{ stroke: "#2a2a4a" }} tickLine={false}
                  tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} width={40} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value, name) => [`€${Number(value).toLocaleString()}`, String(name)]} labelStyle={{ color: "#888" }} />
                <Bar dataKey="salary" fill="#00ff41" name="Salary" radius={[2, 2, 0, 0]} />
                <Bar dataKey="expenses" fill="#ff4444" name="Expenses" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ===== YEARLY COMPARISON ===== */}
      {filteredYearlyChart.length > 1 && (
        <div className="pixel-card p-4">
          <h3 className="font-pixel text-xs text-pixel-purple mb-3">MULTI-YEAR TELEMETRY</h3>
          <div className="w-full h-48 sm:h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredYearlyChart} barGap={2}>
                <CartesianGrid stroke="#2a2a4a" strokeDasharray="3 3" />
                <XAxis dataKey="year" tick={{ fill: "#888", fontFamily: "VT323, monospace", fontSize: 14 }} axisLine={{ stroke: "#2a2a4a" }} tickLine={false} />
                <YAxis tick={{ fill: "#888", fontFamily: "VT323, monospace", fontSize: 14 }} axisLine={{ stroke: "#2a2a4a" }} tickLine={false}
                  tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} width={40} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value, name) => [`€${Number(value).toLocaleString()}`, String(name)]} labelStyle={{ color: "#888" }} />
                <Bar dataKey="salary" fill="#00ff41" name="Income" radius={[2, 2, 0, 0]} />
                <Bar dataKey="expenses" fill="#ff4444" name="Expenses" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-[#2a2a4a]">
            {filteredYearlyChart.map((y) => (
              <div key={y.year} className="text-center">
                <p className="font-pixel text-[8px] text-gray-500">{y.year}</p>
                <p className={`font-pixel-body text-lg ${y.net >= 0 ? "text-pixel-green" : "text-pixel-red"}`}>
                  {y.net >= 0 ? "+" : ""}€{y.net.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== NO DATA PROMPT ===== */}
      {!hasFinanceData && !demoMode && (
        <div className="pixel-card p-8 text-center">
          <p className="font-pixel text-xs text-gray-500 mb-2">NO TELEMETRY DATA</p>
          <p className="font-pixel-body text-xl text-gray-400">
            Import a bank CSV on the Finance page to see your mission data here
          </p>
        </div>
      )}

      {/* ===== DEMO GOAL CARDS ===== */}
      {demoMode && DEMO_GOAL_CATEGORIES.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {DEMO_GOAL_CATEGORIES.map((cat) => (
            <div key={cat.label} className="pixel-card p-3 text-center">
              <p className={`font-pixel text-[9px] ${cat.color} leading-relaxed`}>{cat.label.toUpperCase()}</p>
              <p className="font-pixel-body text-3xl text-white mt-2">{cat.achieved}<span className="text-gray-500"> / {cat.total}</span></p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
