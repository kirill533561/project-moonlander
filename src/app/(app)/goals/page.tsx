"use client";

import { useState, useCallback } from "react";
import { useLocalStorage } from "@/lib/use-local-storage";
import { playCounterClick, playSuccess, playDreamAdded, playDelete } from "@/lib/sounds";
type GoalTab = "dreams" | "economic" | "wishlist" | "personal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

/* ---------- constants ---------- */

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

const CURRENT_YEAR = 2026;
const CURRENT_MONTH = 4; // May = index 4 (0-based)
const YEARS = [2025, 2026, 2027];

/* ---------- types ---------- */

interface LongRangeDream {
  id: string;
  name: string;
  achieved: boolean;
  target?: number | null;
  current?: number | null;
}

interface EconomicGoal {
  id: string;
  name: string;
  targetType: "cumulative" | "end_of_year";
  target: number;
  current: number;
  monthlyInputs: (number | null)[];
}

interface WishlistItem {
  id: string;
  name: string;
  achievedMonth: number | null; // 0-based month index or null
}

interface PersonalDevGoal {
  id: string;
  name: string;
  trackingType: "counter" | "ratio";
  monthlyTarget?: number;
  monthlyValues: (number | null)[];
}

/* ---------- initial mock data ---------- */

const INITIAL_DREAMS: LongRangeDream[] = [];

const INITIAL_ECONOMIC: EconomicGoal[] = [];

const INITIAL_WISHLIST: WishlistItem[] = [];

const INITIAL_PERSONAL: PersonalDevGoal[] = [];

/* ---------- helpers ---------- */

function isPastMonth(monthIdx: number, selectedYear: number): boolean {
  if (selectedYear < CURRENT_YEAR) return true;
  if (selectedYear > CURRENT_YEAR) return false;
  return monthIdx < CURRENT_MONTH;
}

function isCurrentMonth(monthIdx: number, selectedYear: number): boolean {
  return selectedYear === CURRENT_YEAR && monthIdx === CURRENT_MONTH;
}

function isFutureMonth(monthIdx: number, selectedYear: number): boolean {
  if (selectedYear > CURRENT_YEAR) return true;
  if (selectedYear < CURRENT_YEAR) return false;
  return monthIdx > CURRENT_MONTH;
}

function formatNum(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 9);
}

/* ---------- component ---------- */

export default function GoalsPage() {
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [activeTab, setActiveTab] = useState<GoalTab>("dreams");
  const [dreams, setDreams] = useLocalStorage<LongRangeDream[]>("ml-goals-dreams", INITIAL_DREAMS);
  const [economic, setEconomic] = useLocalStorage<EconomicGoal[]>("ml-goals-economic", INITIAL_ECONOMIC);
  const [wishlist, setWishlist] = useLocalStorage<WishlistItem[]>("ml-goals-wishlist", INITIAL_WISHLIST);
  const [personal, setPersonal] = useLocalStorage<PersonalDevGoal[]>("ml-goals-personal", INITIAL_PERSONAL);

  // Add-dialog form states
  const [newDreamName, setNewDreamName] = useState("");
  const [newDreamTarget, setNewDreamTarget] = useState("");
  const [newEconName, setNewEconName] = useState("");
  const [newEconTarget, setNewEconTarget] = useState("");
  const [newEconType, setNewEconType] = useState<"cumulative" | "end_of_year">("cumulative");
  const [newWishName, setNewWishName] = useState("");
  const [newPersName, setNewPersName] = useState("");
  const [newPersType, setNewPersType] = useState<"counter" | "ratio">("counter");
  const [newPersTarget, setNewPersTarget] = useState("");

  /* --- dream actions --- */
  const toggleDream = useCallback((id: string) => {
    setDreams((prev) => {
      const updated = prev.map((d) =>
        d.id === id ? { ...d, achieved: !d.achieved } : d
      );
      const toggled = updated.find((d) => d.id === id);
      if (toggled?.achieved) setTimeout(() => playSuccess(), 100);
      return updated;
    });
  }, []);

  const deleteDream = useCallback((id: string) => {
    playDelete();
    setDreams((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const deleteEconomicGoal = useCallback((id: string) => {
    playDelete();
    setEconomic((prev) => prev.filter((g) => g.id !== id));
  }, []);

  const deleteWishItem = useCallback((id: string) => {
    playDelete();
    setWishlist((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const deletePersonalGoal = useCallback((id: string) => {
    playDelete();
    setPersonal((prev) => prev.filter((g) => g.id !== id));
  }, []);

  const addDream = useCallback(() => {
    if (!newDreamName.trim()) return;
    const target = newDreamTarget ? Number(newDreamTarget) : null;
    setDreams((prev) => [
      ...prev,
      { id: generateId(), name: newDreamName.trim(), achieved: false, target, current: target ? 0 : null },
    ]);
    setNewDreamName("");
    setNewDreamTarget("");
    playDreamAdded();
  }, [newDreamName, newDreamTarget]);

  const updateDreamCurrent = useCallback((id: string, value: string) => {
    setDreams((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const current = value === "" ? 0 : Number(value);
        const achieved = d.target ? current >= d.target : d.achieved;
        if (achieved && !d.achieved) setTimeout(() => playSuccess(), 100);
        return { ...d, current, achieved };
      })
    );
  }, []);

  /* --- economic actions --- */
  const addEconomicGoal = useCallback(() => {
    if (!newEconName.trim() || !newEconTarget) return;
    setEconomic((prev) => [
      ...prev,
      {
        id: generateId(),
        name: newEconName.trim(),
        targetType: newEconType,
        target: Number(newEconTarget),
        current: 0,
        monthlyInputs: Array(12).fill(null),
      },
    ]);
    setNewEconName("");
    setNewEconTarget("");
    setNewEconType("cumulative");
  }, [newEconName, newEconTarget, newEconType]);

  const updateEconMonthly = useCallback(
    (goalId: string, monthIdx: number, value: string) => {
      setEconomic((prev) =>
        prev.map((g) => {
          if (g.id !== goalId) return g;
          const inputs = [...g.monthlyInputs];
          inputs[monthIdx] = value === "" ? null : Number(value);
          const current = inputs.reduce<number>((sum, v) => sum + (v ?? 0), 0);
          const wasBelow = g.current < g.target;
          const nowAbove = current >= g.target;
          if (wasBelow && nowAbove) setTimeout(() => playSuccess(), 100);
          return { ...g, monthlyInputs: inputs, current };
        })
      );
    },
    []
  );

  /* --- wishlist actions --- */
  const toggleWishMonth = useCallback(
    (itemId: string, monthIdx: number) => {
      if (isPastMonth(monthIdx, selectedYear)) return;
      setWishlist((prev) =>
        prev.map((w) => {
          if (w.id !== itemId) return w;
          const newMonth = w.achievedMonth === monthIdx ? null : monthIdx;
          if (newMonth !== null) setTimeout(() => playSuccess(), 100);
          return { ...w, achievedMonth: newMonth };
        })
      );
    },
    [selectedYear]
  );

  const addWishItem = useCallback(() => {
    if (!newWishName.trim()) return;
    setWishlist((prev) => [
      ...prev,
      { id: generateId(), name: newWishName.trim(), achievedMonth: null },
    ]);
    setNewWishName("");
  }, [newWishName]);

  /* --- personal dev actions --- */
  const incrementCounter = useCallback(
    (goalId: string) => {
      playCounterClick();
      setPersonal((prev) =>
        prev.map((g) => {
          if (g.id !== goalId || g.trackingType !== "counter") return g;
          const values = [...g.monthlyValues];
          values[CURRENT_MONTH] = ((values[CURRENT_MONTH] as number) ?? 0) + 1;
          if (
            g.monthlyTarget &&
            values[CURRENT_MONTH]! >= g.monthlyTarget &&
            ((g.monthlyValues[CURRENT_MONTH] as number) ?? 0) < g.monthlyTarget
          ) {
            setTimeout(() => playSuccess(), 200);
          }
          return { ...g, monthlyValues: values };
        })
      );
    },
    []
  );

  const updatePersonalValue = useCallback(
    (goalId: string, monthIdx: number, value: string) => {
      if (isPastMonth(monthIdx, selectedYear)) return;
      setPersonal((prev) =>
        prev.map((g) => {
          if (g.id !== goalId) return g;
          const values = [...g.monthlyValues];
          values[monthIdx] = value === "" ? null : Number(value);
          return { ...g, monthlyValues: values };
        })
      );
    },
    [selectedYear]
  );

  const addPersonalGoal = useCallback(() => {
    if (!newPersName.trim()) return;
    setPersonal((prev) => [
      ...prev,
      {
        id: generateId(),
        name: newPersName.trim(),
        trackingType: newPersType,
        monthlyTarget: newPersType === "counter" ? Number(newPersTarget) || 10 : undefined,
        monthlyValues: Array(12).fill(null),
      },
    ]);
    setNewPersName("");
    setNewPersType("counter");
    setNewPersTarget("");
  }, [newPersName, newPersType, newPersTarget]);

  /* --- computed --- */
  const getYearlyAvg = (values: (number | null)[]): string => {
    const filled = values.filter((v): v is number => v !== null);
    if (filled.length === 0) return "--";
    return (filled.reduce((a, b) => a + b, 0) / filled.length).toFixed(2);
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6">
      {/* Page title */}
      <h2 className="font-pixel text-xs text-pixel-cyan mb-4">MISSION GOALS</h2>

      {/* ===== Year Selector ===== */}
      <div className="flex gap-2 flex-wrap">
        {YEARS.map((year) => (
          <button
            key={year}
            onClick={() => setSelectedYear(year)}
            className={`pixel-btn px-4 py-2 text-sm ${
              selectedYear === year
                ? "bg-pixel-cyan pixel-btn-active"
                : ""
            }`}
          >
            {year}
          </button>
        ))}
      </div>

      {/* ===== Goal Section Buttons ===== */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setActiveTab("dreams")}
          className={`pixel-btn pixel-btn-purple py-3 font-pixel-body text-lg ${activeTab === "dreams" ? "bg-pixel-purple pixel-btn-active" : ""}`}
        >
          🌙 DREAMS
        </button>
        <button
          onClick={() => setActiveTab("economic")}
          className={`pixel-btn pixel-btn-gold py-3 font-pixel-body text-lg ${activeTab === "economic" ? "bg-pixel-gold pixel-btn-active" : ""}`}
        >
          💰 ECONOMIC
        </button>
        <button
          onClick={() => setActiveTab("wishlist")}
          className={`pixel-btn py-3 font-pixel-body text-lg ${activeTab === "wishlist" ? "bg-pixel-cyan pixel-btn-active" : ""}`}
        >
          ⭐ WISHLIST
        </button>
        <button
          onClick={() => setActiveTab("personal")}
          className={`pixel-btn pixel-btn-green py-3 font-pixel-body text-lg ${activeTab === "personal" ? "bg-pixel-green pixel-btn-active" : ""}`}
        >
          💪 PERSONAL
        </button>
      </div>

      {/* ==================== A) LONG-RANGE DREAMS ==================== */}
      {activeTab === "dreams" && (
          <section className="flex flex-col gap-4">
            <h3 className="font-pixel text-[10px] text-pixel-purple">
              LONG-RANGE DREAMS
            </h3>

            {dreams.map((dream) => {
              const hasTarget = dream.target != null && dream.target > 0;
              const pct = hasTarget ? Math.min(((dream.current ?? 0) / dream.target!) * 100, 100) : 0;
              return (
                <div
                  key={dream.id}
                  className={`pixel-card p-4 flex flex-col gap-3 transition-all ${
                    dream.achieved ? "border-pixel-green" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Toggle — tap to mark achieved (only for non-target dreams) */}
                    {!hasTarget && (
                      <button
                        onClick={() => toggleDream(dream.id)}
                        className={`w-10 h-10 flex items-center justify-center shrink-0 border-2 transition-all font-pixel-body text-xl ${
                          dream.achieved
                            ? "bg-pixel-green border-pixel-green text-white"
                            : "bg-transparent border-gray-600 text-gray-600 hover:border-pixel-purple hover:text-pixel-purple"
                        }`}
                      >
                        {dream.achieved ? "★" : "☆"}
                      </button>
                    )}

                    {hasTarget && (
                      <span className={`text-xl shrink-0 ${dream.achieved ? "text-pixel-green" : "text-pixel-purple"}`}>
                        {dream.achieved ? "★" : "🎯"}
                      </span>
                    )}

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p className={`font-pixel-body text-xl truncate ${dream.achieved ? "text-pixel-green" : "text-white"}`}>
                        {dream.name}
                      </p>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => deleteDream(dream.id)}
                      className="pixel-btn w-10 h-10 flex items-center justify-center text-lg shrink-0 border-pixel-red/50 text-pixel-red/50 hover:border-pixel-red hover:text-pixel-red hover:bg-pixel-red/10"
                    >
                      −
                    </button>
                  </div>

                  {/* Target-based: show current value input + progress */}
                  {hasTarget && (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          value={dream.current ?? 0}
                          onChange={(e) => updateDreamCurrent(dream.id, e.target.value)}
                          className="bg-[#1a1a3a] border-2 border-[#2a2a4a] text-white font-pixel-body text-xl px-3 py-1.5 w-28 focus:border-pixel-purple focus:outline-none text-center"
                          step="any"
                        />
                        <span className="font-pixel-body text-lg text-gray-500">
                          / {dream.target!.toLocaleString()}
                        </span>
                        <span className={`font-pixel-body text-lg ml-auto ${pct >= 100 ? "text-pixel-green" : "text-pixel-purple"}`}>
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                      <div className="pixel-progress h-4">
                        <div
                          className={`pixel-progress-fill ${pct >= 100 ? "bg-pixel-green" : "bg-pixel-purple"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Add Dream Dialog */}
            <Dialog>
              <DialogTrigger className="pixel-btn pixel-btn-purple px-4 py-3 w-full font-pixel-body text-lg">+ ADD DREAM</DialogTrigger>
              <DialogContent className="pixel-card border-pixel-purple max-w-sm">
                <DialogHeader>
                  <DialogTitle className="font-pixel text-[10px] text-pixel-purple">
                    NEW LONG-RANGE DREAM
                  </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4 mt-4">
                  <input
                    type="text"
                    placeholder="Dream name..."
                    value={newDreamName}
                    onChange={(e) => setNewDreamName(e.target.value)}
                    className="w-full bg-space-dark border-2 border-pixel-purple px-3 py-2 font-pixel-body text-lg text-white placeholder-gray-600 focus:outline-none focus:border-pixel-cyan"
                  />
                  <div>
                    <p className="font-pixel-body text-sm text-gray-500 mb-1">Target value (optional — leave empty for simple ✓/✗)</p>
                    <input
                      type="number"
                      placeholder="e.g. 5000, 100000..."
                      value={newDreamTarget}
                      onChange={(e) => setNewDreamTarget(e.target.value)}
                      className="w-full bg-space-dark border-2 border-pixel-purple px-3 py-2 font-pixel-body text-lg text-white placeholder-gray-600 focus:outline-none focus:border-pixel-cyan"
                      step="any"
                    />
                  </div>
                  <DialogClose onClick={addDream} className="pixel-btn pixel-btn-purple px-4 py-3 w-full font-pixel-body text-lg">LAUNCH DREAM</DialogClose>
                </div>
              </DialogContent>
            </Dialog>
          </section>
      )}

      {/* ==================== B) ECONOMIC GOALS ==================== */}
      {activeTab === "economic" && (
          <section className="flex flex-col gap-4">
            <h3 className="font-pixel text-[10px] text-pixel-gold">
              ECONOMIC GOALS
            </h3>

            {economic.map((goal) => {
              const pct = Math.min((goal.current / goal.target) * 100, 100);
              const achieved = goal.current >= goal.target;

              return (
                <div key={goal.id} className="pixel-card p-4 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-pixel-body text-xl text-white">
                        {goal.name}
                      </p>
                      <p className="font-pixel-body text-base text-gray-500 mt-1">
                        {goal.targetType === "cumulative" ? "Cumulative" : "End of Year"} target
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xl">
                        {achieved ? (
                          <span className="text-pixel-green">&#10003;</span>
                        ) : (
                          <span className="text-pixel-red">&#10007;</span>
                        )}
                      </span>
                      <button
                        onClick={() => deleteEconomicGoal(goal.id)}
                        className="pixel-btn w-9 h-9 flex items-center justify-center text-lg border-pixel-red/50 text-pixel-red/50 hover:border-pixel-red hover:text-pixel-red hover:bg-pixel-red/10"
                      >
                        −
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="flex items-center gap-3">
                    <div className="pixel-progress flex-1">
                      <div
                        className={`pixel-progress-fill ${achieved ? "bg-pixel-gold" : "bg-pixel-green"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="font-pixel-body text-sm text-pixel-gold whitespace-nowrap">
                      {formatNum(goal.current)} / {formatNum(goal.target)}
                    </span>
                  </div>

                  {/* Monthly inputs grid */}
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-2">
                    {MONTHS.map((month, idx) => (
                      <div key={month} className="flex flex-col items-center gap-1">
                        <span className="font-pixel text-[7px] text-gray-500">
                          {month.toUpperCase()}
                        </span>
                        <input
                          type="number"
                          value={goal.monthlyInputs[idx] ?? ""}
                          onChange={(e) => updateEconMonthly(goal.id, idx, e.target.value)}
                          className="w-full bg-space-dark border border-pixel-gold/30 px-1 py-1 font-pixel-body text-sm text-center text-white focus:outline-none focus:border-pixel-gold disabled:opacity-30"
                          step="any"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Add Economic Goal Dialog */}
            <Dialog>
              <DialogTrigger className="pixel-btn pixel-btn-gold px-4 py-3 w-full font-pixel-body text-lg">+ ADD GOAL</DialogTrigger>
              <DialogContent className="pixel-card border-pixel-gold max-w-sm">
                <DialogHeader>
                  <DialogTitle className="font-pixel text-[10px] text-pixel-gold">
                    NEW ECONOMIC GOAL
                  </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4 mt-4">
                  <input
                    type="text"
                    placeholder="Goal name..."
                    value={newEconName}
                    onChange={(e) => setNewEconName(e.target.value)}
                    className="w-full bg-space-dark border-2 border-pixel-gold px-3 py-2 font-pixel-body text-lg text-white placeholder-gray-600 focus:outline-none focus:border-pixel-cyan"
                  />
                  <input
                    type="number"
                    placeholder="Target value..."
                    value={newEconTarget}
                    onChange={(e) => setNewEconTarget(e.target.value)}
                    className="w-full bg-space-dark border-2 border-pixel-gold px-3 py-2 font-pixel-body text-lg text-white placeholder-gray-600 focus:outline-none focus:border-pixel-cyan"
                    step="any"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setNewEconType("cumulative")}
                      className={`pixel-btn flex-1 px-3 py-2 font-pixel-body text-base ${
                        newEconType === "cumulative"
                          ? "pixel-btn-gold bg-pixel-gold pixel-btn-active"
                          : "pixel-btn-gold"
                      }`}
                    >
                      CUMULATIVE
                    </button>
                    <button
                      onClick={() => setNewEconType("end_of_year")}
                      className={`pixel-btn flex-1 px-3 py-2 font-pixel-body text-base ${
                        newEconType === "end_of_year"
                          ? "pixel-btn-gold bg-pixel-gold pixel-btn-active"
                          : "pixel-btn-gold"
                      }`}
                    >
                      END OF YEAR
                    </button>
                  </div>
                  <DialogClose onClick={addEconomicGoal} className="pixel-btn pixel-btn-gold px-4 py-3 w-full font-pixel-body text-lg">LAUNCH GOAL</DialogClose>
                </div>
              </DialogContent>
            </Dialog>
          </section>
      )}

      {/* ==================== C) THINGS I WANT ==================== */}
      {activeTab === "wishlist" && (
          <section className="flex flex-col gap-4">
            <h3 className="font-pixel text-[10px] text-pixel-cyan">
              THINGS I WANT
            </h3>

            {wishlist.map((item) => (
              <div key={item.id} className="pixel-card p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-pixel-body text-xl text-white">
                    {item.name}
                    {item.achievedMonth !== null && (
                      <span className="text-pixel-green ml-2">
                        &#10003; {MONTHS[item.achievedMonth]}
                      </span>
                    )}
                  </p>
                  <button
                    onClick={() => deleteWishItem(item.id)}
                    className="pixel-btn w-9 h-9 flex items-center justify-center text-lg shrink-0 border-pixel-red/50 text-pixel-red/50 hover:border-pixel-red hover:text-pixel-red hover:bg-pixel-red/10"
                  >
                    −
                  </button>
                </div>

                {/* Month grid */}
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {MONTHS.map((month, idx) => {
                    const past = isPastMonth(idx, selectedYear);
                    const active = item.achievedMonth === idx;

                    return (
                      <button
                        key={month}
                        onClick={() => toggleWishMonth(item.id, idx)}
                        disabled={past}
                        title={past ? "TIME TRAVEL DENIED" : `Mark ${month}`}
                        className={`relative flex flex-col items-center gap-1 px-2 py-2 border transition-colors ${
                          active
                            ? "border-pixel-green bg-pixel-green/20 text-pixel-green"
                            : past
                              ? "border-gray-700 bg-gray-900/50 text-gray-600 cursor-not-allowed"
                              : "border-gray-600 hover:border-pixel-cyan text-gray-400 hover:text-white"
                        }`}
                      >
                        <span className="font-pixel text-[7px]">
                          {month.toUpperCase()}
                        </span>
                        {active && (
                          <span className="text-sm">&#10003;</span>
                        )}
                        {past && !active && (
                          <span className="text-sm" title="TIME TRAVEL DENIED">
                            &#128274;
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Add Wish Item Dialog */}
            <Dialog>
              <DialogTrigger className="pixel-btn px-4 py-3 w-full font-pixel-body text-lg">+ ADD ITEM</DialogTrigger>
              <DialogContent className="pixel-card border-pixel-cyan max-w-sm">
                <DialogHeader>
                  <DialogTitle className="font-pixel text-[10px] text-pixel-cyan">
                    NEW WISHLIST ITEM
                  </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4 mt-4">
                  <input
                    type="text"
                    placeholder="I want to..."
                    value={newWishName}
                    onChange={(e) => setNewWishName(e.target.value)}
                    className="w-full bg-space-dark border-2 border-pixel-cyan px-3 py-2 font-pixel-body text-lg text-white placeholder-gray-600 focus:outline-none focus:border-pixel-green"
                  />
                  <DialogClose onClick={addWishItem} className="pixel-btn px-4 py-3 w-full font-pixel-body text-lg">ADD TO WISHLIST</DialogClose>
                </div>
              </DialogContent>
            </Dialog>
          </section>
      )}

      {/* ==================== D) PERSONAL DEVELOPMENT ==================== */}
      {activeTab === "personal" && (
          <section className="flex flex-col gap-4">
            <h3 className="font-pixel text-[10px] text-pixel-green">
              PERSONAL DEVELOPMENT
            </h3>

            {personal.map((goal) => {
              const currentMonthVal = (goal.monthlyValues[CURRENT_MONTH] as number) ?? 0;
              const yearlyAvg = getYearlyAvg(goal.monthlyValues);

              return (
                <div key={goal.id} className="pixel-card p-4 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-pixel-body text-xl text-white">
                        {goal.name}
                      </p>
                      <p className="font-pixel-body text-base text-gray-500">
                        {goal.trackingType === "counter" ? "Counter" : "Ratio"} | Avg: {yearlyAvg}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Counter: big + button for current month */}
                      {goal.trackingType === "counter" &&
                        selectedYear === CURRENT_YEAR && (
                          <>
                            <span className="font-pixel-body text-2xl text-pixel-green">
                              {currentMonthVal}
                              <span className="text-gray-500">
                                /{goal.monthlyTarget}
                              </span>
                            </span>
                            <button
                              onClick={() => incrementCounter(goal.id)}
                              className="pixel-btn pixel-btn-green w-14 h-14 flex items-center justify-center text-3xl"
                            >
                              +
                            </button>
                          </>
                        )}
                      <button
                        onClick={() => deletePersonalGoal(goal.id)}
                        className="pixel-btn w-9 h-9 flex items-center justify-center text-lg border-pixel-red/50 text-pixel-red/50 hover:border-pixel-red hover:text-pixel-red hover:bg-pixel-red/10"
                      >
                        −
                      </button>
                    </div>
                  </div>

                  {/* Monthly progress grid */}
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-2">
                    {MONTHS.map((month, idx) => {
                      const val = goal.monthlyValues[idx];
                      const past = isPastMonth(idx, selectedYear);
                      const current = isCurrentMonth(idx, selectedYear);
                      const locked = past;

                      // Progress calculation
                      let pct = 0;
                      if (goal.trackingType === "counter" && goal.monthlyTarget) {
                        pct = val !== null ? Math.min((val / goal.monthlyTarget) * 100, 100) : 0;
                      } else if (goal.trackingType === "ratio") {
                        pct = val !== null ? Math.min(val * 100, 100) : 0;
                      }

                      return (
                        <div
                          key={month}
                          className="flex flex-col items-center gap-1"
                          title={
                            locked
                              ? "⚠ TIME TRAVEL DENIED ⚠ This mission log is sealed, Commander."
                              : undefined
                          }
                        >
                          <span
                            className={`font-pixel text-[7px] ${
                              current ? "text-pixel-cyan" : "text-gray-500"
                            }`}
                          >
                            {month.toUpperCase()}
                          </span>

                          {goal.trackingType === "counter" ? (
                            <div className="w-full text-center">
                              <span className="font-pixel-body text-sm text-white">
                                {val ?? "--"}
                              </span>
                            </div>
                          ) : (
                            <input
                              type="number"
                              value={val ?? ""}
                              onChange={(e) =>
                                updatePersonalValue(goal.id, idx, e.target.value)
                              }
                              disabled={locked}
                              className={`w-full bg-space-dark border px-1 py-1 font-pixel-body text-sm text-center text-white focus:outline-none ${
                                locked
                                  ? "border-gray-700 opacity-40 cursor-not-allowed"
                                  : "border-pixel-green/30 focus:border-pixel-green"
                              }`}
                              step="any"
                              min="0"
                              max={goal.trackingType === "ratio" ? "1" : undefined}
                              placeholder={goal.trackingType === "ratio" ? "0.0" : "0"}
                            />
                          )}

                          {/* Mini progress bar per month */}
                          <div className="pixel-progress w-full h-2">
                            <div
                              className={`pixel-progress-fill ${
                                pct >= 100 ? "bg-pixel-gold" : "bg-pixel-green"
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>

                          {locked && (
                            <span className="text-[10px] text-gray-600">
                              &#128274;
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Add Personal Goal Dialog */}
            <Dialog>
              <DialogTrigger className="pixel-btn pixel-btn-green px-4 py-3 w-full font-pixel-body text-lg">+ ADD GOAL</DialogTrigger>
              <DialogContent className="pixel-card border-pixel-green max-w-sm">
                <DialogHeader>
                  <DialogTitle className="font-pixel text-[10px] text-pixel-green">
                    NEW PERSONAL DEV GOAL
                  </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4 mt-4">
                  <input
                    type="text"
                    placeholder="Goal name..."
                    value={newPersName}
                    onChange={(e) => setNewPersName(e.target.value)}
                    className="w-full bg-space-dark border-2 border-pixel-green px-3 py-2 font-pixel-body text-lg text-white placeholder-gray-600 focus:outline-none focus:border-pixel-cyan"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setNewPersType("counter")}
                      className={`pixel-btn flex-1 px-3 py-2 font-pixel-body text-base ${
                        newPersType === "counter"
                          ? "pixel-btn-green bg-pixel-green pixel-btn-active"
                          : "pixel-btn-green"
                      }`}
                    >
                      COUNTER
                    </button>
                    <button
                      onClick={() => setNewPersType("ratio")}
                      className={`pixel-btn flex-1 px-3 py-2 font-pixel-body text-base ${
                        newPersType === "ratio"
                          ? "pixel-btn-green bg-pixel-green pixel-btn-active"
                          : "pixel-btn-green"
                      }`}
                    >
                      RATIO
                    </button>
                  </div>
                  {newPersType === "counter" && (
                    <input
                      type="number"
                      placeholder="Monthly target..."
                      value={newPersTarget}
                      onChange={(e) => setNewPersTarget(e.target.value)}
                      className="w-full bg-space-dark border-2 border-pixel-green px-3 py-2 font-pixel-body text-lg text-white placeholder-gray-600 focus:outline-none focus:border-pixel-cyan"
                    />
                  )}
                  <DialogClose onClick={addPersonalGoal} className="pixel-btn pixel-btn-green px-4 py-3 w-full font-pixel-body text-lg">LAUNCH GOAL</DialogClose>
                </div>
              </DialogContent>
            </Dialog>
          </section>
      )}
    </div>
  );
}
