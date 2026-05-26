"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/* ---------- types ---------- */

interface Holding {
  id: string;
  ticker: string;
  quantity: number | null; // null for things like BTC (no share count)
  totalValue: number;
  action?: string;
}

interface Target {
  id: string;
  ticker: string;
  quantity: number;
  targetPrice: number;
}

/* ---------- mock data ---------- */

const INITIAL_HOLDINGS: Holding[] = [
  { id: "1", ticker: "ABBV", quantity: 4, totalValue: 694.09 },
  { id: "2", ticker: "AXP", quantity: 3, totalValue: 638.79 },
  { id: "3", ticker: "BAC", quantity: 9, totalValue: 251.51 },
  { id: "4", ticker: "V", quantity: 5, totalValue: 1222.03 },
  { id: "5", ticker: "NN", quantity: 66, totalValue: 2409.29 },
  { id: "6", ticker: "OXY", quantity: 15, totalValue: 855.03 },
  { id: "7", ticker: "GOLD ETF", quantity: 10, totalValue: 861.81 },
  { id: "8", ticker: "20Y Bond ETF", quantity: 1001, totalValue: 3400.01 },
  { id: "9", ticker: "S&P Short", quantity: 356, totalValue: 2518.84 },
  { id: "10", ticker: "BTC", quantity: null, totalValue: 300.0 },
  { id: "11", ticker: "GME", quantity: 0, totalValue: 0, action: "Sell" },
];

const INITIAL_TARGETS: Target[] = [
  { id: "t1", ticker: "AXP", quantity: 5, targetPrice: 226 },
  { id: "t2", ticker: "V", quantity: 8, targetPrice: 250 },
  { id: "t3", ticker: "ASML", quantity: 2, targetPrice: 500 },
  { id: "t4", ticker: "NVDA", quantity: 12, targetPrice: 85 },
  { id: "t5", ticker: "GOOG", quantity: 10, targetPrice: 110 },
  { id: "t6", ticker: "AMZN", quantity: 10, targetPrice: 110 },
];

const TARGET_PORTFOLIO_TOTAL = 29735;
const AVAILABLE_CASH = 4378.87;

/* ---------- helpers ---------- */

function fmt(n: number) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

/* ---------- component ---------- */

export default function StocksPage() {
  const [holdings, setHoldings] = useState<Holding[]>(INITIAL_HOLDINGS);
  const [targets, setTargets] = useState<Target[]>(INITIAL_TARGETS);

  // dialog open state
  const [holdingDialogOpen, setHoldingDialogOpen] = useState(false);
  const [targetDialogOpen, setTargetDialogOpen] = useState(false);
  const [editingHolding, setEditingHolding] = useState<Holding | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // form state — add holding
  const [newTicker, setNewTicker] = useState("");
  const [newQty, setNewQty] = useState("");
  const [newValue, setNewValue] = useState("");

  // form state — add target
  const [newTargetTicker, setNewTargetTicker] = useState("");
  const [newTargetQty, setNewTargetQty] = useState("");
  const [newTargetPrice, setNewTargetPrice] = useState("");

  // form state — edit holding
  const [editTicker, setEditTicker] = useState("");
  const [editQty, setEditQty] = useState("");
  const [editValue, setEditValue] = useState("");

  /* derived */
  const totalCurrentValue = holdings.reduce((s, h) => s + h.totalValue, 0);
  const totalTargetValue = TARGET_PORTFOLIO_TOTAL;
  const progressPct = Math.min(
    Math.round((totalCurrentValue / totalTargetValue) * 100),
    100,
  );

  /* handlers */

  function addHolding() {
    if (!newTicker.trim()) return;
    const qty = newQty ? parseFloat(newQty) : null;
    const val = parseFloat(newValue) || 0;
    setHoldings((prev) => [
      ...prev,
      { id: genId(), ticker: newTicker.toUpperCase(), quantity: qty, totalValue: val },
    ]);
    setNewTicker("");
    setNewQty("");
    setNewValue("");
    setHoldingDialogOpen(false);
  }

  function deleteHolding(id: string) {
    setHoldings((prev) => prev.filter((h) => h.id !== id));
  }

  function openEditDialog(holding: Holding) {
    setEditingHolding(holding);
    setEditTicker(holding.ticker);
    setEditQty(holding.quantity != null ? String(holding.quantity) : "");
    setEditValue(String(holding.totalValue));
    setEditDialogOpen(true);
  }

  function saveEdit() {
    if (!editingHolding) return;
    setHoldings((prev) =>
      prev.map((h) =>
        h.id === editingHolding.id
          ? {
              ...h,
              ticker: editTicker.toUpperCase() || h.ticker,
              quantity: editQty ? parseFloat(editQty) : null,
              totalValue: parseFloat(editValue) || h.totalValue,
            }
          : h,
      ),
    );
    setEditDialogOpen(false);
    setEditingHolding(null);
  }

  function addTarget() {
    if (!newTargetTicker.trim()) return;
    const qty = parseFloat(newTargetQty) || 0;
    const price = parseFloat(newTargetPrice) || 0;
    setTargets((prev) => [
      ...prev,
      { id: genId(), ticker: newTargetTicker.toUpperCase(), quantity: qty, targetPrice: price },
    ]);
    setNewTargetTicker("");
    setNewTargetQty("");
    setNewTargetPrice("");
    setTargetDialogOpen(false);
  }

  function deleteTarget(id: string) {
    setTargets((prev) => prev.filter((t) => t.id !== id));
  }

  /* ---------- render ---------- */

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6">
      {/* Page title */}
      <h2 className="font-pixel text-xs text-pixel-cyan mb-4">STOCK COMMAND</h2>

      {/* ===== Portfolio Summary ===== */}
      <section className="pixel-card p-4">
        <h3 className="font-pixel text-[10px] text-pixel-gold mb-3">
          PORTFOLIO SUMMARY
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="font-pixel text-[8px] text-pixel-cyan leading-relaxed">
              CURRENT VALUE
            </p>
            <p className="font-pixel-body text-lg text-pixel-green mt-1">
              {fmt(totalCurrentValue)}
            </p>
          </div>
          <div>
            <p className="font-pixel text-[8px] text-pixel-cyan leading-relaxed">
              TARGET VALUE
            </p>
            <p className="font-pixel-body text-lg text-pixel-gold mt-1">
              {fmt(totalTargetValue)}
            </p>
          </div>
          <div>
            <p className="font-pixel text-[8px] text-pixel-cyan leading-relaxed">
              AVAILABLE CASH
            </p>
            <p className="font-pixel-body text-lg text-white mt-1">
              {fmt(AVAILABLE_CASH)}
            </p>
          </div>
          <div>
            <p className="font-pixel text-[8px] text-pixel-cyan leading-relaxed">
              % PROGRESS
            </p>
            <p className="font-pixel-body text-lg text-pixel-purple mt-1">
              {progressPct}%
            </p>
          </div>
        </div>
        {/* progress bar */}
        <div className="pixel-progress mt-4 h-3">
          <div
            className="pixel-progress-fill bg-pixel-gold"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </section>

      {/* ===== Current Holdings ===== */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-pixel text-[10px] text-pixel-green">
            CURRENT HOLDINGS
          </h3>
          <Dialog open={holdingDialogOpen} onOpenChange={setHoldingDialogOpen}>
            <DialogTrigger className="pixel-btn pixel-btn-gold font-pixel text-[8px] px-3 py-1">+ ADD HOLDING</DialogTrigger>
            <DialogContent className="bg-[#0f0f2a] border-2 border-pixel-gold max-w-sm">
              <DialogHeader>
                <DialogTitle className="font-pixel text-[10px] text-pixel-gold">
                  ADD HOLDING
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-3 mt-2">
                <input
                  className="bg-[#1a1a3a] border border-[#2a2a4a] text-white font-pixel-body text-sm px-3 py-2 rounded outline-none focus:border-pixel-gold"
                  placeholder="Ticker (e.g. AAPL)"
                  value={newTicker}
                  onChange={(e) => setNewTicker(e.target.value)}
                />
                <input
                  className="bg-[#1a1a3a] border border-[#2a2a4a] text-white font-pixel-body text-sm px-3 py-2 rounded outline-none focus:border-pixel-gold"
                  placeholder="Quantity (optional)"
                  type="number"
                  value={newQty}
                  onChange={(e) => setNewQty(e.target.value)}
                />
                <input
                  className="bg-[#1a1a3a] border border-[#2a2a4a] text-white font-pixel-body text-sm px-3 py-2 rounded outline-none focus:border-pixel-gold"
                  placeholder="Total Value ($)"
                  type="number"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                />
                <button
                  onClick={addHolding}
                  className="pixel-btn pixel-btn-green font-pixel text-[8px] py-2"
                >
                  CONFIRM
                </button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="pixel-card overflow-x-auto">
          <table className="w-full min-w-[480px] font-pixel-body text-sm">
            <thead>
              <tr className="bg-[#1a1a3a]">
                <th className="text-left font-pixel text-[8px] text-pixel-cyan px-3 py-2">
                  TICKER
                </th>
                <th className="text-right font-pixel text-[8px] text-pixel-cyan px-3 py-2">
                  QTY
                </th>
                <th className="text-right font-pixel text-[8px] text-pixel-cyan px-3 py-2">
                  TOTAL VALUE
                </th>
                <th className="text-center font-pixel text-[8px] text-pixel-cyan px-3 py-2">
                  ACTION
                </th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((h) => (
                <tr
                  key={h.id}
                  className="border-t border-[#2a2a4a] hover:bg-[#1a1a3a]/50 transition-colors"
                >
                  <td className="px-3 py-2 text-white">{h.ticker}</td>
                  <td className="px-3 py-2 text-right text-gray-400">
                    {h.quantity != null ? h.quantity : "-"}
                  </td>
                  <td className="px-3 py-2 text-right text-pixel-green">
                    {fmt(h.totalValue)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {h.action && (
                        <span className="font-pixel text-[7px] text-pixel-red">
                          {h.action}
                        </span>
                      )}
                      <button
                        onClick={() => openEditDialog(h)}
                        className="font-pixel text-[7px] text-pixel-cyan hover:text-white transition-colors px-1"
                        aria-label={`Edit ${h.ticker}`}
                      >
                        EDIT
                      </button>
                      <button
                        onClick={() => deleteHolding(h.id)}
                        className="font-pixel text-[7px] text-pixel-red hover:text-white transition-colors px-1"
                        aria-label={`Delete ${h.ticker}`}
                      >
                        DEL
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-pixel-gold">
                <td className="px-3 py-2 font-pixel text-[8px] text-pixel-gold">
                  TOTAL
                </td>
                <td />
                <td className="px-3 py-2 text-right font-pixel text-[10px] text-pixel-gold">
                  {fmt(totalCurrentValue)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* ===== Edit Holding Dialog ===== */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-[#0f0f2a] border-2 border-pixel-cyan max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-pixel text-[10px] text-pixel-cyan">
              EDIT HOLDING
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-2">
            <input
              className="bg-[#1a1a3a] border border-[#2a2a4a] text-white font-pixel-body text-sm px-3 py-2 rounded outline-none focus:border-pixel-cyan"
              placeholder="Ticker"
              value={editTicker}
              onChange={(e) => setEditTicker(e.target.value)}
            />
            <input
              className="bg-[#1a1a3a] border border-[#2a2a4a] text-white font-pixel-body text-sm px-3 py-2 rounded outline-none focus:border-pixel-cyan"
              placeholder="Quantity"
              type="number"
              value={editQty}
              onChange={(e) => setEditQty(e.target.value)}
            />
            <input
              className="bg-[#1a1a3a] border border-[#2a2a4a] text-white font-pixel-body text-sm px-3 py-2 rounded outline-none focus:border-pixel-cyan"
              placeholder="Total Value ($)"
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
            />
            <button
              onClick={saveEdit}
              className="pixel-btn pixel-btn-green font-pixel text-[8px] py-2"
            >
              SAVE
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== Future Target Portfolio ===== */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-pixel text-[10px] text-pixel-purple">
            FUTURE TARGET PORTFOLIO
          </h3>
          <Dialog open={targetDialogOpen} onOpenChange={setTargetDialogOpen}>
            <DialogTrigger className="pixel-btn pixel-btn-gold font-pixel text-[8px] px-3 py-1">+ ADD TARGET</DialogTrigger>
            <DialogContent className="bg-[#0f0f2a] border-2 border-pixel-gold max-w-sm">
              <DialogHeader>
                <DialogTitle className="font-pixel text-[10px] text-pixel-gold">
                  ADD TARGET
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-3 mt-2">
                <input
                  className="bg-[#1a1a3a] border border-[#2a2a4a] text-white font-pixel-body text-sm px-3 py-2 rounded outline-none focus:border-pixel-gold"
                  placeholder="Ticker (e.g. MSFT)"
                  value={newTargetTicker}
                  onChange={(e) => setNewTargetTicker(e.target.value)}
                />
                <input
                  className="bg-[#1a1a3a] border border-[#2a2a4a] text-white font-pixel-body text-sm px-3 py-2 rounded outline-none focus:border-pixel-gold"
                  placeholder="Quantity"
                  type="number"
                  value={newTargetQty}
                  onChange={(e) => setNewTargetQty(e.target.value)}
                />
                <input
                  className="bg-[#1a1a3a] border border-[#2a2a4a] text-white font-pixel-body text-sm px-3 py-2 rounded outline-none focus:border-pixel-gold"
                  placeholder="Target Price ($)"
                  type="number"
                  value={newTargetPrice}
                  onChange={(e) => setNewTargetPrice(e.target.value)}
                />
                <button
                  onClick={addTarget}
                  className="pixel-btn pixel-btn-green font-pixel text-[8px] py-2"
                >
                  CONFIRM
                </button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="pixel-card overflow-x-auto">
          <table className="w-full min-w-[520px] font-pixel-body text-sm">
            <thead>
              <tr className="bg-[#1a1a3a]">
                <th className="text-left font-pixel text-[8px] text-pixel-cyan px-3 py-2">
                  TICKER
                </th>
                <th className="text-right font-pixel text-[8px] text-pixel-cyan px-3 py-2">
                  QTY
                </th>
                <th className="text-right font-pixel text-[8px] text-pixel-cyan px-3 py-2">
                  TARGET PRICE
                </th>
                <th className="text-right font-pixel text-[8px] text-pixel-cyan px-3 py-2">
                  TOTAL
                </th>
                <th className="text-right font-pixel text-[8px] text-pixel-cyan px-3 py-2">
                  % ALLOC
                </th>
                <th className="text-center font-pixel text-[8px] text-pixel-cyan px-3 py-2">
                  ACTION
                </th>
              </tr>
            </thead>
            <tbody>
              {targets.map((t) => {
                const total = t.quantity * t.targetPrice;
                const allocPct = ((total / totalTargetValue) * 100).toFixed(1);
                return (
                  <tr
                    key={t.id}
                    className="border-t border-[#2a2a4a] hover:bg-[#1a1a3a]/50 transition-colors"
                  >
                    <td className="px-3 py-2 text-white">{t.ticker}</td>
                    <td className="px-3 py-2 text-right text-gray-400">
                      {t.quantity}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-400">
                      {fmt(t.targetPrice)}
                    </td>
                    <td className="px-3 py-2 text-right text-pixel-green">
                      {fmt(total)}
                    </td>
                    <td className="px-3 py-2 text-right text-pixel-purple">
                      {allocPct}%
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => deleteTarget(t.id)}
                        className="font-pixel text-[7px] text-pixel-red hover:text-white transition-colors px-1"
                        aria-label={`Delete target ${t.ticker}`}
                      >
                        DEL
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-pixel-gold">
                <td className="px-3 py-2 font-pixel text-[8px] text-pixel-gold">
                  TOTAL TARGET
                </td>
                <td />
                <td />
                <td className="px-3 py-2 text-right font-pixel text-[10px] text-pixel-gold">
                  {fmt(totalTargetValue)}
                </td>
                <td />
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </div>
  );
}
