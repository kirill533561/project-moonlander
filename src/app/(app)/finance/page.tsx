"use client";

import { useState, useMemo } from "react";
import { useLocalStorage } from "@/lib/use-local-storage";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

// ─── Types ────────────────────────────────────────────────────────────────────

type VariableType =
  | "income_source"
  | "expense_category"
  | "investment_account"
  | "bank_account";

interface FinanceVariable {
  id: string;
  name: string;
  type: VariableType;
  fields: string[];
}

interface MonthData {
  [variableId: string]: {
    [field: string]: number;
  };
}

interface YearData {
  [month: number]: MonthData;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const YEARS = [2021, 2022, 2023, 2024, 2025, 2026];

const DEFAULT_VARIABLES: FinanceVariable[] = [];

// ─── Mock data generator ──────────────────────────────────────────────────────

function generateMockData(variables: FinanceVariable[]): Record<number, YearData> {
  const data: Record<number, YearData> = {};

  for (const year of YEARS) {
    data[year] = {};
    for (let month = 0; month < 12; month++) {
      const monthData: MonthData = {};
      for (const v of variables) {
        monthData[v.id] = {};
        for (const field of v.fields) {
          if (v.id === "salary" && field === "amount") {
            monthData[v.id][field] = 3500 + Math.floor(Math.random() * 500);
          } else if (v.id === "expenses" && field === "amount") {
            monthData[v.id][field] = 1800 + Math.floor(Math.random() * 600);
          } else if (v.id === "expenses" && field === "pure_living_expenses") {
            monthData[v.id][field] = 1200 + Math.floor(Math.random() * 400);
          } else if (field === "portfolio") {
            monthData[v.id][field] = 5000 + Math.floor(Math.random() * 15000);
          } else if (field === "balance_eur") {
            monthData[v.id][field] = 2000 + Math.floor(Math.random() * 8000);
          } else if (field === "in_out") {
            monthData[v.id][field] = -500 + Math.floor(Math.random() * 1500);
          } else if (field === "change_vs_prev") {
            monthData[v.id][field] = -300 + Math.floor(Math.random() * 900);
          } else if (field === "total_pl") {
            monthData[v.id][field] = -1000 + Math.floor(Math.random() * 4000);
          } else if (field === "dividends") {
            monthData[v.id][field] = Math.floor(Math.random() * 120);
          } else if (field === "cash_outstanding") {
            monthData[v.id][field] = Math.floor(Math.random() * 2000);
          } else {
            monthData[v.id][field] = Math.floor(Math.random() * 1000);
          }
        }
      }
      data[year][month] = monthData;
    }
  }
  return data;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatLabel(field: string): string {
  return field
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatCurrency(value: number): string {
  const prefix = value < 0 ? "-" : "";
  return `${prefix}€${Math.abs(value).toLocaleString("en-US")}`;
}

const TYPE_LABELS: Record<VariableType, string> = {
  income_source: "Income Source",
  expense_category: "Expense Category",
  investment_account: "Investment Account",
  bank_account: "Bank Account",
};

const INPUT_CLASS =
  "bg-[#1a1a3a] border-2 border-[#2a2a4a] text-white font-pixel-body px-2 py-1.5 w-full focus:border-pixel-cyan focus:outline-none text-sm";

// ─── CSV Import Logic ────────────────────────────────────────────────────────

const INVESTMENT_IBANS: Record<string, string> = {
  "NL16TRBK4296071611": "Trade Republic",
  "NL80BUNQ2141986478": "Bunq Savings",
  "NL33ABNA0577685503": "Degiro",
  "DE75202208000000019190": "Coinbase",
};

const BUNQ_TOPUP_IBAN = "NL04ADYB2017400157";
const SALARY_KEYWORDS = ["salaris", "salary"];

interface ParsedMonth {
  year: number;
  month: number;
  salary: number;
  expenses: number;
  investments: Record<string, number>;
  bunqTopups: number;
  otherIncome: number;
  balanceEnd: string;
  txCount: number;
}

function parseRaboCSV(text: string): ParsedMonth[] {
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];

  const header = lines[0];
  const cols = header.split(",").map((c) => c.replace(/"/g, "").trim());
  const dateIdx = cols.indexOf("Datum");
  const amountIdx = cols.indexOf("Bedrag");
  const balanceIdx = cols.indexOf("Saldo na trn");
  const counterIbanIdx = cols.indexOf("Tegenrekening IBAN/BBAN");
  const desc1Idx = cols.findIndex((c) => c.startsWith("Omschrijving-1") || c.startsWith("Omschrijving"));
  const desc2Idx = cols.findIndex((c) => c === "Omschrijving-2");

  if (dateIdx === -1 || amountIdx === -1) return [];

  const monthly: Record<string, ParsedMonth> = {};

  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVRow(lines[i]);
    if (row.length <= amountIdx) continue;

    const date = row[dateIdx]?.trim();
    if (!date || !date.match(/^\d{4}-\d{2}-\d{2}$/)) continue;

    const [yearStr, monthStr] = date.split("-");
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);
    const key = `${year}-${month}`;

    if (!monthly[key]) {
      monthly[key] = {
        year, month, salary: 0, expenses: 0,
        investments: {}, bunqTopups: 0, otherIncome: 0,
        balanceEnd: "", txCount: 0,
      };
    }

    const m = monthly[key];
    const amount = parseFloat(row[amountIdx].replace(/"/g, "").replace(/\./g, "").replace(",", ".").replace("+", ""));
    const counterIban = (row[counterIbanIdx] || "").replace(/"/g, "").trim();
    const desc1 = (row[desc1Idx] || "").replace(/"/g, "").trim().toLowerCase();
    const desc2 = desc2Idx >= 0 ? (row[desc2Idx] || "").replace(/"/g, "").trim().toLowerCase() : "";
    const fullDesc = `${desc1} ${desc2}`;

    m.txCount++;
    m.balanceEnd = (row[balanceIdx] || "").replace(/"/g, "").trim();

    if (amount > 0 && SALARY_KEYWORDS.some((kw) => fullDesc.includes(kw))) {
      m.salary += amount;
    } else if (amount < 0 && counterIban in INVESTMENT_IBANS) {
      const name = INVESTMENT_IBANS[counterIban];
      m.investments[name] = (m.investments[name] || 0) + Math.abs(amount);
    } else if (amount < 0 && counterIban === BUNQ_TOPUP_IBAN) {
      m.bunqTopups += Math.abs(amount);
    } else if (amount > 0) {
      m.otherIncome += amount;
    } else if (amount < 0) {
      m.expenses += Math.abs(amount);
    }
  }

  return Object.values(monthly).sort((a, b) => a.year - b.year || a.month - b.month);
}

function parseCSVRow(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function ImportCSVDialog({
  onImport,
}: {
  onImport: (data: ParsedMonth[], vars: FinanceVariable[]) => void;
}) {
  const [parsed, setParsed] = useState<ParsedMonth[] | null>(null);
  const [fileName, setFileName] = useState("");

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const result = parseRaboCSV(text);
      setParsed(result);
    };
    reader.readAsText(file, "latin1");
  };

  const handleImport = () => {
    if (!parsed) return;

    const vars: FinanceVariable[] = [
      { id: "salary", name: "Salary", type: "income_source", fields: ["amount"] },
      { id: "expenses", name: "Expenses", type: "expense_category", fields: ["amount"] },
      { id: "other_income", name: "Other Income", type: "income_source", fields: ["amount"] },
      { id: "bunq_topups", name: "Bunq Top-ups", type: "bank_account", fields: ["amount"] },
    ];

    const investmentNames = new Set<string>();
    parsed.forEach((m) => Object.keys(m.investments).forEach((n) => investmentNames.add(n)));
    investmentNames.forEach((name) => {
      const id = name.toLowerCase().replace(/\s+/g, "_");
      vars.push({ id, name, type: "investment_account", fields: ["amount"] });
    });

    onImport(parsed, vars);
  };

  const totalMonths = parsed?.length || 0;
  const yearRange = parsed && parsed.length > 0
    ? `${parsed[0].year} - ${parsed[parsed.length - 1].year}`
    : "";

  return (
    <Dialog>
      <DialogTrigger className="pixel-btn pixel-btn-green px-3 py-2 text-sm">
        📥 Import CSV
      </DialogTrigger>
      <DialogContent className="bg-[#0f0f2a] border-2 border-[#2a2a4a] text-white max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-pixel text-xs text-pixel-green">
            IMPORT BANK CSV
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-2">
          <p className="font-pixel-body text-base text-gray-400">
            Upload a Rabobank CSV export. The parser will auto-detect salary, expenses, and investment transfers.
          </p>

          <label className="pixel-btn pixel-btn-green py-3 text-center cursor-pointer">
            {fileName || "CHOOSE FILE"}
            <input
              type="file"
              accept=".csv"
              onChange={handleFile}
              className="hidden"
            />
          </label>

          {parsed && (
            <div className="pixel-card p-3 space-y-2">
              <p className="font-pixel text-[9px] text-pixel-cyan">PREVIEW</p>
              <p className="font-pixel-body text-base text-white">
                {totalMonths} months found ({yearRange})
              </p>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {parsed.map((m) => (
                  <div key={`${m.year}-${m.month}`} className="flex justify-between font-pixel-body text-sm border-b border-[#2a2a4a]/50 py-1">
                    <span className="text-gray-400">
                      {MONTHS[m.month - 1]} {m.year}
                    </span>
                    <span className="text-pixel-green">+{m.salary.toFixed(0)}</span>
                    <span className="text-pixel-red">-{m.expenses.toFixed(0)}</span>
                    <span className="text-gray-500">{m.txCount}tx</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {parsed && parsed.length > 0 && (
            <DialogClose
              onClick={handleImport}
              className="pixel-btn pixel-btn-green py-3 text-lg w-full"
            >
              IMPORT {totalMonths} MONTHS
            </DialogClose>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Configure Dialog ─────────────────────────────────────────────────────────

function ConfigureDialog({
  variables,
  onSave,
}: {
  variables: FinanceVariable[];
  onSave: (vars: FinanceVariable[]) => void;
}) {
  const [editVars, setEditVars] = useState<FinanceVariable[]>(() =>
    variables.map((v) => ({ ...v, fields: [...v.fields] }))
  );
  const [newFieldInputs, setNewFieldInputs] = useState<Record<string, string>>(
    {}
  );

  function addVariable() {
    const id = `var_${Date.now()}`;
    setEditVars((prev) => [
      ...prev,
      { id, name: "New Variable", type: "income_source", fields: ["amount"] },
    ]);
  }

  function removeVariable(id: string) {
    setEditVars((prev) => prev.filter((v) => v.id !== id));
  }

  function updateVariable(
    id: string,
    key: keyof FinanceVariable,
    value: string
  ) {
    setEditVars((prev) =>
      prev.map((v) => (v.id === id ? { ...v, [key]: value } : v))
    );
  }

  function addField(varId: string) {
    const fieldName = (newFieldInputs[varId] || "").trim().toLowerCase().replace(/\s+/g, "_");
    if (!fieldName) return;
    setEditVars((prev) =>
      prev.map((v) =>
        v.id === varId && !v.fields.includes(fieldName)
          ? { ...v, fields: [...v.fields, fieldName] }
          : v
      )
    );
    setNewFieldInputs((prev) => ({ ...prev, [varId]: "" }));
  }

  function removeField(varId: string, field: string) {
    setEditVars((prev) =>
      prev.map((v) =>
        v.id === varId
          ? { ...v, fields: v.fields.filter((f) => f !== field) }
          : v
      )
    );
  }

  return (
    <Dialog>
      <DialogTrigger className="pixel-btn pixel-btn-gold px-3 py-2 text-sm">Configure Variables</DialogTrigger>
      <DialogContent className="bg-[#0f0f2a] border-2 border-[#2a2a4a] text-white max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-pixel text-[10px] text-pixel-cyan">
            CONFIGURE FINANCE VARIABLES
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {editVars.map((v) => (
            <div
              key={v.id}
              className="bg-[#1a1a3a] border border-[#2a2a4a] p-3 space-y-2"
            >
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={v.name}
                  onChange={(e) =>
                    updateVariable(v.id, "name", e.target.value)
                  }
                  className={INPUT_CLASS}
                  placeholder="Variable name"
                />
                <button
                  onClick={() => removeVariable(v.id)}
                  className="text-pixel-red font-pixel-body text-xl px-2 hover:bg-[#2a2a4a] shrink-0"
                  title="Remove variable"
                >
                  X
                </button>
              </div>

              <select
                value={v.type}
                onChange={(e) =>
                  updateVariable(v.id, "type", e.target.value)
                }
                className={INPUT_CLASS}
              >
                {Object.entries(TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>

              <div className="space-y-1">
                <span className="font-pixel-body text-xs text-gray-400 uppercase tracking-wide">
                  Fields
                </span>
                <div className="flex flex-wrap gap-1">
                  {v.fields.map((f) => (
                    <span
                      key={f}
                      className="inline-flex items-center gap-1 bg-[#0f0f2a] border border-[#2a2a4a] px-2 py-0.5 font-pixel-body text-sm text-pixel-cyan"
                    >
                      {formatLabel(f)}
                      <button
                        onClick={() => removeField(v.id, f)}
                        className="text-pixel-red text-xs hover:text-white ml-1"
                      >
                        x
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-1 mt-1">
                  <input
                    type="text"
                    value={newFieldInputs[v.id] || ""}
                    onChange={(e) =>
                      setNewFieldInputs((prev) => ({
                        ...prev,
                        [v.id]: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addField(v.id);
                      }
                    }}
                    placeholder="new_field_name"
                    className={`${INPUT_CLASS} flex-1`}
                  />
                  <button
                    onClick={() => addField(v.id)}
                    className="pixel-btn px-2 py-1 text-xs shrink-0"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={addVariable}
            className="pixel-btn pixel-btn-green w-full py-2 text-sm"
          >
            + Add Variable
          </button>
        </div>

        <DialogFooter className="mt-4 flex gap-2">
          <DialogClose className="pixel-btn px-4 py-2 text-sm">Cancel</DialogClose>
          <DialogClose onClick={() => onSave(editVars)} className="pixel-btn pixel-btn-gold px-4 py-2 text-sm">Save</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Expandable Variable Card ─────────────────────────────────────────────────

function VariableCard({
  variable,
  values,
  onChange,
}: {
  variable: FinanceVariable;
  values: Record<string, number>;
  onChange: (field: string, value: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="pixel-card p-0 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-[#1a1a3a] transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="font-pixel text-[9px] text-pixel-cyan">
            {expanded ? "▼" : "▶"}
          </span>
          <span className="font-pixel text-[9px] text-white">
            {variable.name}
          </span>
        </div>
        <span className="font-pixel-body text-xs text-gray-500 uppercase">
          {TYPE_LABELS[variable.type]}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-[#2a2a4a] px-3 py-3 space-y-2">
          {variable.fields.map((field) => {
            const val = values[field] ?? 0;
            return (
              <div key={field} className="space-y-1">
                <label className="font-pixel-body text-xs text-gray-400 uppercase tracking-wide block">
                  {formatLabel(field)}
                </label>
                <div className="flex items-center gap-2">
                  <span className="font-pixel-body text-sm text-gray-500">
                    €
                  </span>
                  <input
                    type="number"
                    value={val}
                    onChange={(e) =>
                      onChange(field, parseFloat(e.target.value) || 0)
                    }
                    className={`${INPUT_CLASS} font-pixel-body text-sm`}
                  />
                  <span
                    className={`font-pixel-body text-sm shrink-0 min-w-[70px] text-right ${
                      val >= 0 ? "text-pixel-green" : "text-pixel-red"
                    }`}
                  >
                    {formatCurrency(val)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Summary Section ──────────────────────────────────────────────────────────

function SummarySection({
  variables,
  monthData,
  comment,
  onCommentChange,
}: {
  variables: FinanceVariable[];
  monthData: MonthData;
  comment: string;
  onCommentChange: (c: string) => void;
}) {
  const summary = useMemo(() => {
    let totalIncome = 0;
    let totalExpenses = 0;
    let totalPortfolio = 0;
    let totalChange = 0;

    for (const v of variables) {
      const vals = monthData[v.id] || {};
      if (v.type === "income_source") {
        totalIncome += vals.amount ?? 0;
      } else if (v.type === "expense_category") {
        totalExpenses += vals.amount ?? 0;
      }
      if (vals.portfolio !== undefined) {
        totalPortfolio += vals.portfolio;
      }
      if (vals.balance_eur !== undefined) {
        totalPortfolio += vals.balance_eur;
      }
      if (vals.change_vs_prev !== undefined) {
        totalChange += vals.change_vs_prev;
      }
    }

    const netIncome = totalIncome - totalExpenses;

    return { totalIncome, totalExpenses, netIncome, totalPortfolio, totalChange };
  }, [variables, monthData]);

  return (
    <div className="pixel-card p-4 space-y-3">
      <h3 className="font-pixel text-[9px] text-pixel-gold mb-3">SUMMARY</h3>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div>
          <span className="font-pixel-body text-xs text-gray-400 block">
            Net Income
          </span>
          <span
            className={`font-pixel text-[10px] ${
              summary.netIncome >= 0 ? "text-pixel-green" : "text-pixel-red"
            }`}
          >
            {formatCurrency(summary.netIncome)}
          </span>
        </div>
        <div>
          <span className="font-pixel-body text-xs text-gray-400 block">
            Total Portfolio
          </span>
          <span className="font-pixel text-[10px] text-pixel-cyan">
            {formatCurrency(summary.totalPortfolio)}
          </span>
        </div>
        <div>
          <span className="font-pixel-body text-xs text-gray-400 block">
            Total Change
          </span>
          <span
            className={`font-pixel text-[10px] ${
              summary.totalChange >= 0 ? "text-pixel-green" : "text-pixel-red"
            }`}
          >
            {formatCurrency(summary.totalChange)}
          </span>
        </div>
        <div>
          <span className="font-pixel-body text-xs text-gray-400 block">
            Income
          </span>
          <span className="font-pixel text-[10px] text-pixel-green">
            {formatCurrency(summary.totalIncome)}
          </span>
        </div>
        <div>
          <span className="font-pixel-body text-xs text-gray-400 block">
            Expenses
          </span>
          <span className="font-pixel text-[10px] text-pixel-red">
            {formatCurrency(summary.totalExpenses)}
          </span>
        </div>
      </div>

      <div className="pt-2 border-t border-[#2a2a4a]">
        <label className="font-pixel-body text-xs text-gray-400 block mb-1">
          Comments
        </label>
        <textarea
          value={comment}
          onChange={(e) => onCommentChange(e.target.value)}
          rows={2}
          placeholder="Notes for this month..."
          className={`${INPUT_CLASS} resize-none`}
        />
      </div>
    </div>
  );
}

// ─── Monthly Overview Table ───────────────────────────────────────────────────

function MonthlyOverviewTable({
  year,
  yearData,
  variables,
  selectedMonth,
  onSelectMonth,
}: {
  year: number;
  yearData: YearData;
  variables: FinanceVariable[];
  selectedMonth: number;
  onSelectMonth: (m: number) => void;
}) {
  function getMonthMetrics(month: number) {
    const md = yearData[month] || {};
    let salary = 0;
    let expenses = 0;

    for (const v of variables) {
      const vals = md[v.id] || {};
      if (v.type === "income_source") salary += vals.amount ?? 0;
      if (v.type === "expense_category") expenses += vals.amount ?? 0;
    }

    return { salary, expenses, netIncome: salary - expenses };
  }

  return (
    <div className="pixel-card p-4">
      <h3 className="font-pixel text-[9px] text-pixel-gold mb-3">
        {year} MONTHLY OVERVIEW
      </h3>
      <div className="overflow-x-auto -mx-4 px-4">
        <table className="w-full min-w-[500px]">
          <thead>
            <tr className="border-b-2 border-[#2a2a4a]">
              <th className="font-pixel text-[8px] text-gray-400 text-left py-2 pr-2">
                MONTH
              </th>
              <th className="font-pixel text-[8px] text-gray-400 text-right py-2 px-2">
                SALARY
              </th>
              <th className="font-pixel text-[8px] text-gray-400 text-right py-2 px-2">
                EXPENSES
              </th>
              <th className="font-pixel text-[8px] text-gray-400 text-right py-2 pl-2">
                NET
              </th>
            </tr>
          </thead>
          <tbody>
            {MONTHS.map((label, i) => {
              const m = getMonthMetrics(i);
              const isSelected = i === selectedMonth;
              return (
                <tr
                  key={i}
                  onClick={() => onSelectMonth(i)}
                  className={`border-b border-[#2a2a4a]/50 cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-[#1a1a3a]"
                      : "hover:bg-[#1a1a3a]/50"
                  }`}
                >
                  <td className="font-pixel-body text-sm text-white py-1.5 pr-2">
                    {label}
                    {isSelected && (
                      <span className="text-pixel-cyan ml-1">◀</span>
                    )}
                  </td>
                  <td className="font-pixel-body text-sm text-pixel-green text-right py-1.5 px-2">
                    {formatCurrency(m.salary)}
                  </td>
                  <td className="font-pixel-body text-sm text-pixel-red text-right py-1.5 px-2">
                    {formatCurrency(m.expenses)}
                  </td>
                  <td
                    className={`font-pixel-body text-sm text-right py-1.5 pl-2 ${
                      m.netIncome >= 0 ? "text-pixel-green" : "text-pixel-red"
                    }`}
                  >
                    {formatCurrency(m.netIncome)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FinancePage() {
  const [variables, setVariables] = useLocalStorage<FinanceVariable[]>("ml-finance-vars", DEFAULT_VARIABLES);
  const [allData, setAllData] = useLocalStorage<Record<number, YearData>>("ml-finance-data", {});
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [comments, setComments] = useLocalStorage<Record<string, string>>("ml-finance-comments", {});

  const commentKey = `${selectedYear}-${selectedMonth}`;
  const currentMonthData = allData[selectedYear]?.[selectedMonth] || {};

  function handleFieldChange(variableId: string, field: string, value: number) {
    setAllData((prev) => {
      const updated = { ...prev };
      const yearData = { ...updated[selectedYear] };
      const monthData = { ...yearData[selectedMonth] };
      monthData[variableId] = { ...(monthData[variableId] || {}), [field]: value };
      yearData[selectedMonth] = monthData;
      updated[selectedYear] = yearData;
      return updated;
    });
  }

  function handleCSVImport(data: ParsedMonth[], newVars: FinanceVariable[]) {
    setVariables(newVars);
    setAllData(() => {
      const updated: Record<number, YearData> = {};
      for (const m of data) {
        if (!updated[m.year]) updated[m.year] = {};
        const monthData: MonthData = {};
        monthData["salary"] = { amount: m.salary };
        monthData["expenses"] = { amount: m.expenses };
        monthData["other_income"] = { amount: m.otherIncome };
        monthData["bunq_topups"] = { amount: m.bunqTopups };
        for (const [name, val] of Object.entries(m.investments)) {
          const id = name.toLowerCase().replace(/\s+/g, "_");
          monthData[id] = { amount: val };
        }
        updated[m.year][m.month - 1] = monthData;
      }
      return updated;
    });
    if (data.length > 0) {
      const last = data[data.length - 1];
      setSelectedYear(last.year);
      setSelectedMonth(last.month - 1);
    }
  }

  function handleSaveVariables(newVars: FinanceVariable[]) {
    setVariables(newVars);
    // Regenerate mock data for any new variables that don't exist yet
    setAllData((prev) => {
      const updated = { ...prev };
      for (const year of YEARS) {
        if (!updated[year]) updated[year] = {};
        for (let month = 0; month < 12; month++) {
          if (!updated[year][month]) updated[year][month] = {};
          for (const v of newVars) {
            if (!updated[year][month][v.id]) {
              updated[year][month][v.id] = {};
              for (const f of v.fields) {
                updated[year][month][v.id][f] = 0;
              }
            }
          }
        }
      }
      return updated;
    });
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Page title */}
      <h2 className="font-pixel text-xs text-pixel-cyan mb-4">FINANCE LOG</h2>

      {/* Top controls: year/month selector + configure button */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex gap-2 flex-1">
          {/* Year selector */}
          <div className="flex-1 sm:flex-none">
            <label className="font-pixel-body text-xs text-gray-400 block mb-1">
              Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className={INPUT_CLASS}
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Month selector */}
          <div className="flex-1 sm:flex-none">
            <label className="font-pixel-body text-xs text-gray-400 block mb-1">
              Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className={INPUT_CLASS}
            >
              {MONTHS.map((m, i) => (
                <option key={i} value={i}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <ImportCSVDialog onImport={handleCSVImport} />
          <ConfigureDialog variables={variables} onSave={handleSaveVariables} />
        </div>
      </div>

      {/* Current selection label */}
      <p className="font-pixel-body text-sm text-gray-500">
        Editing:{" "}
        <span className="text-pixel-cyan">
          {MONTHS[selectedMonth]} {selectedYear}
        </span>
      </p>

      {/* Finance Variable Cards */}
      <div className="space-y-2">
        {variables.map((v) => (
          <VariableCard
            key={v.id}
            variable={v}
            values={currentMonthData[v.id] || {}}
            onChange={(field, value) => handleFieldChange(v.id, field, value)}
          />
        ))}
      </div>

      {/* Summary Section */}
      <SummarySection
        variables={variables}
        monthData={currentMonthData}
        comment={comments[commentKey] || ""}
        onCommentChange={(c) =>
          setComments((prev) => ({ ...prev, [commentKey]: c }))
        }
      />

      {/* Monthly Overview Table */}
      <MonthlyOverviewTable
        year={selectedYear}
        yearData={allData[selectedYear] || {}}
        variables={variables}
        selectedMonth={selectedMonth}
        onSelectMonth={setSelectedMonth}
      />

      {/* Save button (visual only for MVP) */}
      <div className="flex justify-end pb-4">
        <button
          onClick={() => alert("Saved! (mock)")}
          className="pixel-btn pixel-btn-green px-6 py-2 text-sm"
        >
          Save Month
        </button>
      </div>
    </div>
  );
}
