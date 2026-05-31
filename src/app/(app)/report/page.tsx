"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useCloudStorage } from "@/lib/use-cloud-storage";
import { playSuccess, playLevelUp } from "@/lib/sounds";
import { getMonthlyBadge, getBadgeGradient } from "@/lib/rewards";

// ─── Types (mirror the finance + goals pages; same storage keys) ───────────────

type VariableType = "income_source" | "expense_category" | "investment_account" | "bank_account";
interface FinanceVariable { id: string; name: string; type: VariableType; fields: string[]; }
interface MonthData { [variableId: string]: { [field: string]: number }; }
interface YearData { [month: number]: MonthData; }
interface EconomicGoal { id: string; name: string; targetType: "cumulative" | "end_of_year"; target: number; current: number; monthlyInputs: (number | null)[]; }
interface PersonalDevGoal { id: string; name: string; trackingType: "counter" | "ratio"; monthlyTarget?: number; monthlyValues: (number | null)[]; }
interface WishlistItem { id: string; name: string; achievedMonth: number | null; }
interface LongRangeDream { id: string; name: string; achieved: boolean; target?: number | null; current?: number | null; }
interface MonthProgress { confirmed: string[]; completed: boolean; completedAt?: string; }

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const YEARS = [2024, 2025, 2026, 2027];

const INPUT_CLASS =
  "bg-[#1a1a3a] border-2 border-[#2a2a4a] text-white font-pixel-body px-2 py-1.5 w-full focus:border-pixel-cyan focus:outline-none text-sm";

function formatCurrency(value: number): string {
  const prefix = value < 0 ? "-" : "";
  return `${prefix}€${Math.abs(value).toLocaleString("en-US")}`;
}
function formatLabel(field: string): string {
  return field.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

type Domain = "fin" | "eco" | "per" | "wishlist" | "dreams";
interface SectionMeta { id: string; domain: Domain; refId?: string; title: string; }

const DOMAIN_LABEL: Record<Domain, string> = {
  fin: "FINANCE", eco: "ECONOMIC GOAL", per: "PERSONAL DEV", wishlist: "WISHLIST", dreams: "DREAMS",
};
const DOMAIN_COLOR: Record<Domain, string> = {
  fin: "#00ffff", eco: "#ffd700", per: "#00ff41", wishlist: "#00ffff", dreams: "#b967ff",
};

// ─── Celebration ────────────────────────────────────────────────────────────────

function Celebration({ monthLabel, pct, net, onClose }: { monthLabel: string; pct: number; net: number; onClose: () => void }) {
  const badge = getMonthlyBadge(pct / 100);
  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4" onClick={onClose}>
      <div className="fixed inset-0 bg-[#060612]/85 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-sm pixel-card p-6 text-center" onClick={(e) => e.stopPropagation()}>
        <p className="font-pixel text-[10px] text-pixel-green mb-4">MISSION REPORT FILED</p>
        <div className={`w-24 h-24 mx-auto flex items-center justify-center bg-gradient-to-br ${getBadgeGradient(badge.level)} animate-glow`} style={{ borderRadius: "4px" }}>
          <span className="text-5xl">{badge.emoji}</span>
        </div>
        <p className="font-pixel text-[10px] text-pixel-gold mt-4">{badge.name.toUpperCase()}</p>
        <p className="font-pixel-body text-lg text-white mt-2">{monthLabel} logged</p>
        <p className="font-pixel-body text-base text-gray-400 mt-1">
          {pct}% complete · net <span className={net >= 0 ? "text-pixel-green" : "text-pixel-red"}>{formatCurrency(net)}</span>
        </p>
        <button onClick={onClose} className="pixel-btn pixel-btn-green font-pixel text-[8px] px-5 py-2 mt-5">NICE</button>
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function ReportPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const [financeVars] = useCloudStorage<FinanceVariable[]>("ml-finance-vars", []);
  const [financeData, setFinanceData] = useCloudStorage<Record<number, YearData>>("ml-finance-data", {});
  const [comments, setComments] = useCloudStorage<Record<string, string>>("ml-finance-comments", {});
  const [economic, setEconomic] = useCloudStorage<EconomicGoal[]>("ml-goals-economic", []);
  const [personal, setPersonal] = useCloudStorage<PersonalDevGoal[]>("ml-goals-personal", []);
  const [wishlist, setWishlist] = useCloudStorage<WishlistItem[]>("ml-goals-wishlist", []);
  const [dreams, setDreams] = useCloudStorage<LongRangeDream[]>("ml-goals-dreams", []);
  const [progress, setProgress] = useCloudStorage<Record<string, MonthProgress>>("ml-report-progress", {});

  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);

  const key = `${year}-${month}`;
  const monthLabel = `${MONTHS[month]} ${year}`;
  const monthProg: MonthProgress = progress[key] || { confirmed: [], completed: false };
  const monthData: MonthData = financeData[year]?.[month] || {};

  const sections = useMemo<SectionMeta[]>(() => {
    const out: SectionMeta[] = [];
    financeVars.forEach((v) => out.push({ id: `fin:${v.id}`, domain: "fin", refId: v.id, title: v.name }));
    economic.forEach((g) => out.push({ id: `eco:${g.id}`, domain: "eco", refId: g.id, title: g.name }));
    personal.forEach((g) => out.push({ id: `per:${g.id}`, domain: "per", refId: g.id, title: g.name }));
    if (wishlist.length) out.push({ id: "wishlist", domain: "wishlist", title: "Wishlist check-in" });
    if (dreams.length) out.push({ id: "dreams", domain: "dreams", title: "Dreams review" });
    return out;
  }, [financeVars, economic, personal, wishlist, dreams]);

  function isDone(s: SectionMeta): boolean {
    if (monthProg.confirmed.includes(s.id)) return true;
    if (s.domain === "fin") {
      const v = financeVars.find((x) => x.id === s.refId);
      if (!v) return false;
      const vals = monthData[v.id] || {};
      return v.fields.some((f) => (vals[f] ?? 0) !== 0);
    }
    if (s.domain === "eco") {
      const g = economic.find((x) => x.id === s.refId);
      return !!g && g.monthlyInputs[month] != null;
    }
    if (s.domain === "per") {
      const g = personal.find((x) => x.id === s.refId);
      return !!g && g.monthlyValues[month] != null;
    }
    return false; // wishlist / dreams complete via explicit confirm
  }

  const doneCount = sections.filter(isDone).length;
  const total = sections.length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;

  const net = useMemo(() => {
    let inc = 0, exp = 0;
    for (const v of financeVars) {
      const vals = monthData[v.id] || {};
      if (v.type === "income_source") inc += vals.amount ?? 0;
      else if (v.type === "expense_category") exp += vals.amount ?? 0;
    }
    return inc - exp;
  }, [financeVars, monthData]);

  // ── mutations (write through to the real stores) ──
  function setFinanceField(varId: string, field: string, value: number) {
    setFinanceData((prev) => {
      const updated = { ...prev };
      const yd = { ...(updated[year] || {}) };
      const md = { ...(yd[month] || {}) };
      md[varId] = { ...(md[varId] || {}), [field]: value };
      yd[month] = md; updated[year] = yd;
      return updated;
    });
  }
  function setEconMonth(goalId: string, value: string) {
    setEconomic((prev) => prev.map((g) => {
      if (g.id !== goalId) return g;
      const inputs = [...g.monthlyInputs];
      inputs[month] = value === "" ? null : Number(value);
      const current = inputs.reduce<number>((s, v) => s + (v ?? 0), 0);
      return { ...g, monthlyInputs: inputs, current };
    }));
  }
  function setPersonalMonth(goalId: string, value: string) {
    setPersonal((prev) => prev.map((g) => {
      if (g.id !== goalId) return g;
      const vals = [...g.monthlyValues];
      vals[month] = value === "" ? null : Number(value);
      return { ...g, monthlyValues: vals };
    }));
  }
  function toggleWish(itemId: string) {
    setWishlist((prev) => prev.map((w) => w.id === itemId ? { ...w, achievedMonth: w.achievedMonth === month ? null : month } : w));
  }
  function setDreamCurrent(id: string, value: string) {
    setDreams((prev) => prev.map((d) => {
      if (d.id !== id) return d;
      const current = value === "" ? 0 : Number(value);
      const achieved = d.target ? current >= d.target : d.achieved;
      return { ...d, current, achieved };
    }));
  }
  function toggleDreamAchieved(id: string) {
    setDreams((prev) => prev.map((d) => d.id === id ? { ...d, achieved: !d.achieved } : d));
  }
  function confirmSection(id: string) {
    setProgress((prev) => {
      const cur = prev[key] || { confirmed: [], completed: false };
      if (cur.confirmed.includes(id)) return prev;
      return { ...prev, [key]: { ...cur, confirmed: [...cur.confirmed, id] } };
    });
  }
  function complete() {
    setProgress((prev) => {
      const cur = prev[key] || { confirmed: [], completed: false };
      return { ...prev, [key]: { ...cur, completed: true, completedAt: new Date().toISOString() } };
    });
    playSuccess();
    setTimeout(() => playLevelUp(), 280);
    setShowCelebration(true);
    setStarted(false);
    setStep(0);
  }

  const onReview = step >= total;
  const current = sections[step];

  // ── section body for the wizard ──
  function renderBody(s: SectionMeta) {
    if (s.domain === "fin") {
      const v = financeVars.find((x) => x.id === s.refId);
      if (!v) return null;
      return (
        <div className="space-y-2">
          {v.fields.map((field) => {
            const val = (monthData[v.id] || {})[field] ?? 0;
            return (
              <div key={field} className="space-y-1">
                <label className="font-pixel-body text-xs text-gray-400 uppercase tracking-wide block">{formatLabel(field)}</label>
                <div className="flex items-center gap-2">
                  <span className="font-pixel-body text-sm text-gray-500">€</span>
                  <input type="number" value={val} onChange={(e) => setFinanceField(v.id, field, parseFloat(e.target.value) || 0)} className={`${INPUT_CLASS} font-pixel-body text-sm`} />
                  <span className={`font-pixel-body text-sm shrink-0 min-w-[70px] text-right ${val >= 0 ? "text-pixel-green" : "text-pixel-red"}`}>{formatCurrency(val)}</span>
                </div>
              </div>
            );
          })}
        </div>
      );
    }
    if (s.domain === "eco") {
      const g = economic.find((x) => x.id === s.refId);
      if (!g) return null;
      const pctG = Math.min((g.current / g.target) * 100, 100);
      return (
        <div className="space-y-2">
          <label className="font-pixel-body text-xs text-gray-400 uppercase tracking-wide block">{MONTHS[month]} contribution</label>
          <div className="flex items-center gap-2">
            <input type="number" step="any" value={g.monthlyInputs[month] ?? ""} onChange={(e) => setEconMonth(g.id, e.target.value)} className={`${INPUT_CLASS} font-pixel-body text-sm`} placeholder="0" />
          </div>
          <div className="pixel-progress h-3">
            <div className={`pixel-progress-fill ${g.current >= g.target ? "bg-pixel-gold" : "bg-pixel-green"}`} style={{ width: `${pctG}%` }} />
          </div>
          <p className="font-pixel-body text-sm text-gray-500">{g.current.toLocaleString()} / {g.target.toLocaleString()} ({g.targetType === "cumulative" ? "cumulative" : "end of year"})</p>
        </div>
      );
    }
    if (s.domain === "per") {
      const g = personal.find((x) => x.id === s.refId);
      if (!g) return null;
      return (
        <div className="space-y-2">
          <label className="font-pixel-body text-xs text-gray-400 uppercase tracking-wide block">
            {MONTHS[month]} {g.trackingType === "ratio" ? "ratio (0–1)" : "count"}
            {g.trackingType === "counter" && g.monthlyTarget ? ` (target ${g.monthlyTarget})` : ""}
          </label>
          <input type="number" step="any" min="0" max={g.trackingType === "ratio" ? "1" : undefined} value={g.monthlyValues[month] ?? ""} onChange={(e) => setPersonalMonth(g.id, e.target.value)} className={`${INPUT_CLASS} font-pixel-body text-sm`} placeholder={g.trackingType === "ratio" ? "0.0" : "0"} />
        </div>
      );
    }
    if (s.domain === "wishlist") {
      return (
        <div className="space-y-1.5">
          <p className="font-pixel-body text-sm text-gray-500 mb-1">Tick anything you got this month.</p>
          {wishlist.map((w) => {
            const active = w.achievedMonth === month;
            return (
              <button key={w.id} onClick={() => toggleWish(w.id)} className="w-full flex items-center gap-2 text-left py-1.5 border-b border-[#2a2a4a]/50">
                <span className={`w-5 h-5 shrink-0 flex items-center justify-center border-2 text-[10px] ${active ? "border-pixel-green text-pixel-green" : "border-[#3a3a5a] text-transparent"}`}>✓</span>
                <span className={`font-pixel-body text-base ${active ? "text-pixel-green" : "text-white"}`}>{w.name}</span>
                {w.achievedMonth !== null && w.achievedMonth !== month && (
                  <span className="font-pixel text-[7px] text-gray-500 ml-auto">{MONTHS[w.achievedMonth]}</span>
                )}
              </button>
            );
          })}
        </div>
      );
    }
    if (s.domain === "dreams") {
      return (
        <div className="space-y-2">
          <p className="font-pixel-body text-sm text-gray-500 mb-1">Update progress and mark anything achieved.</p>
          {dreams.map((d) => {
            const hasTarget = d.target != null && d.target > 0;
            return (
              <div key={d.id} className="flex items-center gap-2 py-1.5 border-b border-[#2a2a4a]/50">
                {hasTarget ? (
                  <>
                    <span className="font-pixel-body text-base text-white flex-1 truncate">{d.name}</span>
                    <input type="number" step="any" value={d.current ?? 0} onChange={(e) => setDreamCurrent(d.id, e.target.value)} className="bg-[#1a1a3a] border-2 border-[#2a2a4a] text-white font-pixel-body text-sm px-2 py-1 w-24 text-center focus:border-pixel-purple focus:outline-none" />
                    <span className="font-pixel-body text-xs text-gray-500 shrink-0">/ {d.target!.toLocaleString()}</span>
                  </>
                ) : (
                  <button onClick={() => toggleDreamAchieved(d.id)} className="w-full flex items-center gap-2 text-left">
                    <span className={`w-5 h-5 shrink-0 flex items-center justify-center border-2 text-[10px] ${d.achieved ? "border-pixel-green text-pixel-green" : "border-[#3a3a5a] text-transparent"}`}>★</span>
                    <span className={`font-pixel-body text-base ${d.achieved ? "text-pixel-green" : "text-white"}`}>{d.name}</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-pixel text-xs text-pixel-cyan">MONTHLY REPORT</h2>
        {started && (
          <button onClick={() => { setStarted(false); setStep(0); }} className="font-pixel text-[8px] text-gray-400 hover:text-white border-2 border-[#2a2a4a] hover:border-gray-500 px-2 py-1 transition-colors">EXIT</button>
        )}
      </div>

      {/* Month selector */}
      <div className="flex gap-2">
        <div className="flex-1 sm:flex-none">
          <label className="font-pixel-body text-xs text-gray-400 block mb-1">Year</label>
          <select value={year} onChange={(e) => { setYear(Number(e.target.value)); setStarted(false); setStep(0); }} className={INPUT_CLASS}>
            {YEARS.map((y) => (<option key={y} value={y}>{y}</option>))}
          </select>
        </div>
        <div className="flex-1 sm:flex-none">
          <label className="font-pixel-body text-xs text-gray-400 block mb-1">Month</label>
          <select value={month} onChange={(e) => { setMonth(Number(e.target.value)); setStarted(false); setStep(0); }} className={INPUT_CLASS}>
            {MONTHS.map((m, i) => (<option key={i} value={i}>{m}</option>))}
          </select>
        </div>
      </div>

      {total === 0 ? (
        <div className="pixel-card p-8 text-center">
          <p className="font-pixel text-[10px] text-gray-500 mb-2">NOTHING TO REPORT YET</p>
          <p className="font-pixel-body text-lg text-gray-400">
            Set up finance variables on the <Link href="/finance" className="text-pixel-cyan">Finance Log</Link> or add goals on{" "}
            <Link href="/goals" className="text-pixel-cyan">Mission Goals</Link>, then come back to file your monthly report.
          </p>
        </div>
      ) : !started ? (
        <>
          {/* Progress overview */}
          <div className="pixel-card p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-pixel text-[9px] text-pixel-cyan">{monthLabel} PROGRESS</span>
              <span className="font-pixel text-[9px] text-gray-400">{doneCount}/{total} ({pct}%){monthProg.completed ? " · ✓ FILED" : ""}</span>
            </div>
            <div className="flex gap-1">
              {sections.map((s, i) => (
                <div key={s.id} className="flex-1 h-3 border border-[#2a2a4a]" style={{ background: isDone(s) ? (monthProg.completed ? "#00ff41" : "#00ffff") : "#1a1a3a" }} />
              ))}
            </div>
          </div>

          <button onClick={() => { setStarted(true); setStep(0); }} className="pixel-btn pixel-btn-gold w-full py-2.5 font-pixel text-[9px]">
            {monthProg.completed ? `↻ REVISIT ${monthLabel} REPORT` : doneCount > 0 ? `▶ CONTINUE ${monthLabel} REPORT (${doneCount}/${total})` : `🚀 START ${monthLabel} REPORT`}
          </button>

          {/* Section checklist by domain */}
          <div className="pixel-card p-4 space-y-1">
            <p className="font-pixel text-[9px] text-pixel-gold mb-2">SECTIONS</p>
            {sections.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-1.5 border-b border-[#2a2a4a]/50">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 shrink-0" style={{ background: DOMAIN_COLOR[s.domain] }} />
                  <span className="font-pixel-body text-base text-white truncate">{s.title}</span>
                  <span className="font-pixel text-[7px] text-gray-600 shrink-0">{DOMAIN_LABEL[s.domain]}</span>
                </div>
                <span className={`font-pixel text-[8px] shrink-0 ${isDone(s) ? "text-pixel-green" : "text-gray-600"}`}>{isDone(s) ? "✓ DONE" : "○ EMPTY"}</span>
              </div>
            ))}
          </div>

          {/* Year strip */}
          <div className="pixel-card p-3">
            <h3 className="font-pixel text-[9px] text-pixel-gold mb-3">{year} REPORTS</h3>
            <div className="grid grid-cols-6 gap-1.5">
              {MONTHS.map((label, i) => {
                const p = progress[`${year}-${i}`];
                const isComplete = p?.completed;
                const partial = !isComplete && (p?.confirmed?.length ?? 0) > 0;
                const isSel = i === month;
                return (
                  <button key={i} onClick={() => { setMonth(i); setStarted(false); setStep(0); }} className={`flex flex-col items-center gap-1 py-2 border-2 transition-colors ${isSel ? "border-pixel-cyan bg-[#1a1a3a]" : "border-[#2a2a4a] hover:border-gray-500"}`}>
                    <span className="font-pixel text-[8px] text-gray-400">{label.toUpperCase()}</span>
                    <span className="text-[11px] leading-none">{isComplete ? "✅" : partial ? "🟡" : "⚪"}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        /* ── Wizard ── */
        <div className="space-y-4">
          <div className="pixel-card p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-pixel text-[9px] text-pixel-cyan">{onReview ? "REVIEW" : `STEP ${step + 1} / ${total}`}</span>
              <span className="font-pixel text-[9px] text-gray-400">{doneCount}/{total} done</span>
            </div>
            <div className="flex gap-1">
              {sections.map((_, i) => (
                <div key={i} className="flex-1 h-2.5 border border-[#2a2a4a]" style={{ background: i < step || onReview ? "#00ffff" : i === step ? "#00ffff55" : "#1a1a3a" }} />
              ))}
            </div>
          </div>

          {!onReview && current && (
            <div className="pixel-card p-4 space-y-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5" style={{ background: DOMAIN_COLOR[current.domain] }} />
                  <p className="font-pixel text-[10px] text-white">{current.title}</p>
                </div>
                <p className="font-pixel-body text-sm text-gray-500 mt-1">{DOMAIN_LABEL[current.domain]} — {monthLabel}</p>
              </div>
              {renderBody(current)}
              <div className="flex items-center justify-between pt-2">
                <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="font-pixel text-[8px] text-gray-400 hover:text-white border-2 border-[#2a2a4a] hover:border-gray-500 disabled:opacity-30 px-3 py-2 transition-colors">◀ BACK</button>
                <div className="flex gap-2">
                  <button onClick={() => setStep((s) => Math.min(total, s + 1))} className="font-pixel text-[8px] text-gray-500 hover:text-white px-3 py-2 transition-colors">SKIP</button>
                  <button onClick={() => { confirmSection(current.id); setStep((s) => Math.min(total, s + 1)); }} className="pixel-btn pixel-btn-green font-pixel text-[8px] px-4 py-2">CONFIRM ▶</button>
                </div>
              </div>
            </div>
          )}

          {onReview && (
            <div className="pixel-card p-4 space-y-3">
              <p className="font-pixel text-[10px] text-pixel-gold">REVIEW & FILE</p>
              <div className="space-y-1">
                {sections.map((s) => (
                  <button key={s.id} onClick={() => setStep(sections.indexOf(s))} className="w-full flex items-center justify-between py-1.5 border-b border-[#2a2a4a]/50 text-left">
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 shrink-0" style={{ background: DOMAIN_COLOR[s.domain] }} />
                      <span className="font-pixel-body text-base text-white truncate">{s.title}</span>
                    </span>
                    <span className={`font-pixel text-[8px] shrink-0 ${isDone(s) ? "text-pixel-green" : "text-gray-600"}`}>{isDone(s) ? "✓ DONE" : "○ EMPTY"}</span>
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="font-pixel-body text-sm text-gray-400">Net income</span>
                <span className={`font-pixel text-[10px] ${net >= 0 ? "text-pixel-green" : "text-pixel-red"}`}>{formatCurrency(net)}</span>
              </div>
              <div>
                <label className="font-pixel-body text-xs text-gray-400 block mb-1">Comments</label>
                <textarea value={comments[key] || ""} onChange={(e) => setComments((prev) => ({ ...prev, [key]: e.target.value }))} rows={2} placeholder="Notes for this month..." className={`${INPUT_CLASS} resize-none`} />
              </div>
              <div className="flex items-center justify-between pt-2">
                <button onClick={() => setStep((s) => Math.max(0, s - 1))} className="font-pixel text-[8px] text-gray-400 hover:text-white border-2 border-[#2a2a4a] hover:border-gray-500 px-3 py-2 transition-colors">◀ BACK</button>
                <button onClick={complete} className="pixel-btn pixel-btn-gold font-pixel text-[8px] px-4 py-2">✓ FILE {monthLabel} REPORT</button>
              </div>
            </div>
          )}
        </div>
      )}

      {showCelebration && (
        <Celebration monthLabel={monthLabel} pct={pct} net={net} onClose={() => setShowCelebration(false)} />
      )}
    </div>
  );
}
