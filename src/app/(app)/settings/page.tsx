"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface SubField {
  key: string;
  label: string;
  type: "number" | "text";
}

interface FinanceVar {
  id: string;
  name: string;
  type: string;
  sub_fields: SubField[];
}

const DEFAULT_VARS: FinanceVar[] = [
  { id: "1", name: "Salary", type: "income_source", sub_fields: [{ key: "amount", label: "Amount", type: "number" }] },
  { id: "2", name: "Expenses", type: "expense_category", sub_fields: [{ key: "amount", label: "Amount", type: "number" }, { key: "pure_living", label: "Pure Living Expenses", type: "number" }] },
  { id: "3", name: "Degiro", type: "investment_account", sub_fields: [
    { key: "in_out", label: "In/Out", type: "number" },
    { key: "portfolio", label: "Portfolio", type: "number" },
    { key: "cash_outstanding", label: "Cash Outstanding", type: "number" },
    { key: "total_pl", label: "Total P/L (YTD)", type: "number" },
    { key: "change_vs_prev", label: "Change VS Previous", type: "number" },
    { key: "dividends", label: "Dividends", type: "number" },
  ]},
  { id: "4", name: "IBKR", type: "investment_account", sub_fields: [
    { key: "in_out", label: "In/Out", type: "number" },
    { key: "portfolio", label: "Portfolio", type: "number" },
    { key: "cash_outstanding", label: "Cash Outstanding", type: "number" },
    { key: "total_pl", label: "Total P/L (YTD)", type: "number" },
    { key: "change_vs_prev", label: "Change VS Previous", type: "number" },
    { key: "dividends", label: "Dividends", type: "number" },
  ]},
  { id: "5", name: "Coinbase", type: "investment_account", sub_fields: [
    { key: "in_out", label: "In/Out", type: "number" },
    { key: "portfolio", label: "Portfolio", type: "number" },
    { key: "change_vs_prev", label: "Change VS Previous", type: "number" },
    { key: "cash_outstanding", label: "Cash Outstanding", type: "number" },
  ]},
  { id: "6", name: "Wise + Bunq", type: "bank_account", sub_fields: [
    { key: "in_out", label: "In/Out", type: "number" },
    { key: "balance_eur", label: "Balance (EUR)", type: "number" },
    { key: "change_vs_prev", label: "Change VS Previous", type: "number" },
  ]},
  { id: "7", name: "BeFrank", type: "investment_account", sub_fields: [
    { key: "portfolio", label: "Portfolio", type: "number" },
    { key: "cash_outstanding", label: "Cash Outstanding", type: "number" },
    { key: "total_pl", label: "Total P/L (YTD)", type: "number" },
  ]},
];

const VAR_TYPES = [
  { value: "income_source", label: "Income Source" },
  { value: "expense_category", label: "Expense Category" },
  { value: "investment_account", label: "Investment Account" },
  { value: "bank_account", label: "Bank Account" },
];

export default function SettingsPage() {
  const [variables, setVariables] = useState<FinanceVar[]>(DEFAULT_VARS);
  const [editingVar, setEditingVar] = useState<FinanceVar | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newVar, setNewVar] = useState<FinanceVar>({
    id: "",
    name: "",
    type: "income_source",
    sub_fields: [{ key: "", label: "", type: "number" }],
  });

  const handleDelete = (id: string) => {
    setVariables((prev) => prev.filter((v) => v.id !== id));
  };

  const handleAddSubField = (target: "new" | "edit") => {
    const field: SubField = { key: "", label: "", type: "number" };
    if (target === "new") {
      setNewVar((prev) => ({ ...prev, sub_fields: [...prev.sub_fields, field] }));
    } else if (editingVar) {
      setEditingVar({ ...editingVar, sub_fields: [...editingVar.sub_fields, field] });
    }
  };

  const handleSaveNew = () => {
    if (!newVar.name) return;
    const created: FinanceVar = {
      ...newVar,
      id: crypto.randomUUID(),
      sub_fields: newVar.sub_fields.filter((f) => f.key && f.label),
    };
    setVariables((prev) => [...prev, created]);
    setNewVar({ id: "", name: "", type: "income_source", sub_fields: [{ key: "", label: "", type: "number" }] });
    setShowAddDialog(false);
  };

  const handleSaveEdit = () => {
    if (!editingVar) return;
    setVariables((prev) =>
      prev.map((v) => (v.id === editingVar.id ? { ...editingVar, sub_fields: editingVar.sub_fields.filter((f) => f.key && f.label) } : v))
    );
    setEditingVar(null);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="font-pixel text-xs text-pixel-cyan mb-4">SETTINGS</h2>

      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-pixel text-[10px] text-pixel-purple">
            FINANCE VARIABLES
          </h3>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger className="pixel-btn pixel-btn-green text-xs px-3 py-1.5">+ ADD</DialogTrigger>
            <DialogContent className="bg-[#0f0f2a] border-2 border-[#2a2a4a] max-w-md max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-pixel text-[10px] text-pixel-cyan">
                  NEW VARIABLE
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-3 mt-2">
                <input
                  placeholder="Variable name..."
                  value={newVar.name}
                  onChange={(e) => setNewVar((p) => ({ ...p, name: e.target.value }))}
                  className="bg-[#1a1a3a] border-2 border-[#2a2a4a] text-white font-pixel-body px-2 py-1.5 w-full focus:border-pixel-cyan focus:outline-none"
                />
                <select
                  value={newVar.type}
                  onChange={(e) => setNewVar((p) => ({ ...p, type: e.target.value }))}
                  className="bg-[#1a1a3a] border-2 border-[#2a2a4a] text-white font-pixel-body px-2 py-1.5 w-full focus:border-pixel-cyan focus:outline-none"
                >
                  {VAR_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <p className="font-pixel text-[8px] text-gray-500 mt-2">SUB-FIELDS</p>
                {newVar.sub_fields.map((sf, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      placeholder="key"
                      value={sf.key}
                      onChange={(e) => {
                        const updated = [...newVar.sub_fields];
                        updated[i] = { ...sf, key: e.target.value };
                        setNewVar((p) => ({ ...p, sub_fields: updated }));
                      }}
                      className="bg-[#1a1a3a] border-2 border-[#2a2a4a] text-white font-pixel-body px-2 py-1 flex-1 focus:border-pixel-cyan focus:outline-none text-sm"
                    />
                    <input
                      placeholder="Label"
                      value={sf.label}
                      onChange={(e) => {
                        const updated = [...newVar.sub_fields];
                        updated[i] = { ...sf, label: e.target.value };
                        setNewVar((p) => ({ ...p, sub_fields: updated }));
                      }}
                      className="bg-[#1a1a3a] border-2 border-[#2a2a4a] text-white font-pixel-body px-2 py-1 flex-1 focus:border-pixel-cyan focus:outline-none text-sm"
                    />
                    <button
                      onClick={() => setNewVar((p) => ({ ...p, sub_fields: p.sub_fields.filter((_, idx) => idx !== i) }))}
                      className="text-pixel-red font-pixel-body text-sm px-2"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button onClick={() => handleAddSubField("new")} className="font-pixel-body text-sm text-pixel-cyan hover:underline text-left">
                  + Add sub-field
                </button>
                <button onClick={handleSaveNew} className="pixel-btn pixel-btn-green py-2 mt-2">
                  SAVE VARIABLE
                </button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-col gap-2">
          {variables.map((v) => (
            <div key={v.id} className="pixel-card p-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-pixel-body text-sm text-white">{v.name}</span>
                  <span className="font-pixel-body text-xs text-gray-500 ml-2">
                    [{v.type.replace("_", " ")}]
                  </span>
                </div>
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger
                      onClick={() => setEditingVar({ ...v })}
                      className="font-pixel-body text-xs text-pixel-cyan hover:underline"
                    >
                      EDIT
                    </DialogTrigger>
                    <DialogContent className="bg-[#0f0f2a] border-2 border-[#2a2a4a] max-w-md max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="font-pixel text-[10px] text-pixel-cyan">
                          EDIT: {v.name}
                        </DialogTitle>
                      </DialogHeader>
                      {editingVar && editingVar.id === v.id && (
                        <div className="flex flex-col gap-3 mt-2">
                          <input
                            value={editingVar.name}
                            onChange={(e) => setEditingVar({ ...editingVar, name: e.target.value })}
                            className="bg-[#1a1a3a] border-2 border-[#2a2a4a] text-white font-pixel-body px-2 py-1.5 w-full focus:border-pixel-cyan focus:outline-none"
                          />
                          <select
                            value={editingVar.type}
                            onChange={(e) => setEditingVar({ ...editingVar, type: e.target.value })}
                            className="bg-[#1a1a3a] border-2 border-[#2a2a4a] text-white font-pixel-body px-2 py-1.5 w-full focus:border-pixel-cyan focus:outline-none"
                          >
                            {VAR_TYPES.map((t) => (
                              <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                          </select>
                          <p className="font-pixel text-[8px] text-gray-500 mt-2">SUB-FIELDS</p>
                          {editingVar.sub_fields.map((sf, i) => (
                            <div key={i} className="flex gap-2">
                              <input
                                value={sf.key}
                                onChange={(e) => {
                                  const updated = [...editingVar.sub_fields];
                                  updated[i] = { ...sf, key: e.target.value };
                                  setEditingVar({ ...editingVar, sub_fields: updated });
                                }}
                                className="bg-[#1a1a3a] border-2 border-[#2a2a4a] text-white font-pixel-body px-2 py-1 flex-1 focus:border-pixel-cyan focus:outline-none text-sm"
                              />
                              <input
                                value={sf.label}
                                onChange={(e) => {
                                  const updated = [...editingVar.sub_fields];
                                  updated[i] = { ...sf, label: e.target.value };
                                  setEditingVar({ ...editingVar, sub_fields: updated });
                                }}
                                className="bg-[#1a1a3a] border-2 border-[#2a2a4a] text-white font-pixel-body px-2 py-1 flex-1 focus:border-pixel-cyan focus:outline-none text-sm"
                              />
                              <button
                                onClick={() => setEditingVar({ ...editingVar, sub_fields: editingVar.sub_fields.filter((_, idx) => idx !== i) })}
                                className="text-pixel-red font-pixel-body text-sm px-2"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                          <button onClick={() => handleAddSubField("edit")} className="font-pixel-body text-sm text-pixel-cyan hover:underline text-left">
                            + Add sub-field
                          </button>
                          <button onClick={handleSaveEdit} className="pixel-btn pixel-btn-green py-2 mt-2">
                            SAVE CHANGES
                          </button>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                  <button
                    onClick={() => handleDelete(v.id)}
                    className="font-pixel-body text-xs text-pixel-red hover:underline"
                  >
                    DEL
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {v.sub_fields.map((sf) => (
                  <span
                    key={sf.key}
                    className="font-pixel-body text-[11px] text-gray-400 bg-[#1a1a3a] px-1.5 py-0.5 border border-[#2a2a4a]"
                  >
                    {sf.label}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
