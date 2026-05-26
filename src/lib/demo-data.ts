export const DEMO_FINANCE_VARIABLES = [
  { id: "salary", name: "Salary", type: "income_source" as const, fields: ["amount"] },
  { id: "expenses", name: "Expenses", type: "expense_category" as const, fields: ["amount", "pure_living_expenses"] },
  { id: "degiro", name: "Degiro", type: "investment_account" as const, fields: ["in_out", "portfolio", "cash_outstanding", "total_pl", "change_vs_prev", "dividends"] },
  { id: "ibkr", name: "IBKR", type: "investment_account" as const, fields: ["in_out", "portfolio", "cash_outstanding", "total_pl", "change_vs_prev", "dividends"] },
  { id: "coinbase", name: "Coinbase", type: "investment_account" as const, fields: ["in_out", "portfolio", "change_vs_prev", "cash_outstanding"] },
  { id: "wise_bunq", name: "Wise + Bunq", type: "bank_account" as const, fields: ["in_out", "balance_eur", "change_vs_prev"] },
  { id: "befrank", name: "BeFrank", type: "investment_account" as const, fields: ["portfolio", "cash_outstanding", "total_pl"] },
];

export const DEMO_NET_WORTH = [
  { year: "2021", value: 21070 },
  { year: "2022", value: 27992 },
  { year: "2023", value: 32766 },
  { year: "2024", value: 80711 },
  { year: "2025", value: 86811 },
];

export const DEMO_COUNTERS = [
  { id: "gym", name: "Gym Sessions", monthlyTarget: 15, step: 1, unit: "sessions" },
  { id: "steps", name: "Steps (avg)", monthlyTarget: 8500, step: 100, unit: "steps" },
];

export const DEMO_COUNTER_VALUES: Record<string, number> = { gym: 8, steps: 7200 };

export const DEMO_GOAL_CATEGORIES = [
  { label: "Dreams", achieved: 1, total: 3, color: "text-pixel-purple" },
  { label: "Economic", achieved: 2, total: 4, color: "text-pixel-gold" },
  { label: "Wishlist", achieved: 3, total: 5, color: "text-pixel-cyan" },
  { label: "Personal", achieved: 4, total: 6, color: "text-pixel-green" },
];

export const DEMO_DREAMS = [
  { id: "d1", name: "Get Dutch Residency", achieved: false },
  { id: "d2", name: "Buy apartment in Amsterdam Zuid", achieved: false },
  { id: "d3", name: "Passive income EUR 5,000/month", achieved: false },
];

export const DEMO_ECONOMIC_GOALS = [
  { id: "e1", name: "Have 500 users of 9-thirty app", targetType: "end_of_year" as const, target: 500, current: 22, monthlyInputs: [5, 3, 4, 6, 4, null, null, null, null, null, null, null] },
  { id: "e2", name: "Earn at least EUR 50,000 Gross", targetType: "cumulative" as const, target: 50000, current: 34985, monthlyInputs: [7200, 7100, 6800, 7200, 6685, null, null, null, null, null, null, null] },
  { id: "e3", name: "Earn EUR 1,500 in stock transactions", targetType: "cumulative" as const, target: 1500, current: 131.68, monthlyInputs: [45.2, 0, 86.48, 0, 0, null, null, null, null, null, null, null] },
  { id: "e4", name: "Earn EUR 1,000 in dividends", targetType: "cumulative" as const, target: 1000, current: 322.82, monthlyInputs: [65.1, 72.3, 58.22, 68.1, 59.1, null, null, null, null, null, null, null] },
];

export const DEMO_WISHLIST = [
  { id: "w1", name: "Go to Dortmund game", achievedMonth: null },
  { id: "w2", name: "Buy a new apartment", achievedMonth: null },
  { id: "w3", name: "Get a new job", achievedMonth: 5 },
  { id: "w4", name: "Travel to China", achievedMonth: 8 },
];

export const DEMO_PERSONAL_GOALS = [
  { id: "p1", name: "Gym: 15 sessions/month", trackingType: "counter" as const, monthlyTarget: 15, monthlyValues: [12, 14, 15, 11, 8, null, null, null, null, null, null, null] },
  { id: "p2", name: "Steps: 8500/day avg", trackingType: "ratio" as const, monthlyValues: [0.82, 0.91, 0.78, 0.95, 0.7, null, null, null, null, null, null, null] },
  { id: "p3", name: "Weight: 68kg", trackingType: "ratio" as const, monthlyValues: [0.96, 0.94, 0.97, 0.95, 0.93, null, null, null, null, null, null, null] },
  { id: "p4", name: "Pass Dutch exams", trackingType: "ratio" as const, monthlyValues: [0.3, 0.4, 0.5, 0.55, 0.6, null, null, null, null, null, null, null] },
];

// Parsed from Rabo CSV (2021-05 to 2026-05)
export const DEMO_MONTHLY_FINANCE = [
  { year: 2021, month: 5, salary: 3156.48, expenses: 1944.33, investments: 0, bunqTopups: 0 },
  { year: 2021, month: 6, salary: 3350.99, expenses: 1374.85, investments: 0, bunqTopups: 0 },
  { year: 2021, month: 7, salary: 2842.74, expenses: 3093.70, investments: 1000, bunqTopups: 124.99 },
  { year: 2021, month: 8, salary: 2842.74, expenses: 1926.76, investments: 89, bunqTopups: 124.99 },
  { year: 2021, month: 9, salary: 2842.74, expenses: 2315.31, investments: 0, bunqTopups: 0 },
  { year: 2021, month: 10, salary: 2842.74, expenses: 2546.93, investments: 275, bunqTopups: 0 },
  { year: 2021, month: 11, salary: 2842.74, expenses: 1635.70, investments: 0, bunqTopups: 129.99 },
  { year: 2021, month: 12, salary: 2842.74, expenses: 1379.41, investments: 0, bunqTopups: 0 },
  { year: 2022, month: 1, salary: 2939.74, expenses: 4031.54, investments: 0, bunqTopups: 0 },
  { year: 2022, month: 2, salary: 2958.74, expenses: 1502.97, investments: 35, bunqTopups: 3.03 },
  { year: 2022, month: 3, salary: 2947.74, expenses: 1854.28, investments: 135, bunqTopups: 55.78 },
  { year: 2022, month: 4, salary: 2934.74, expenses: 2044.88, investments: 25, bunqTopups: 87.88 },
  { year: 2022, month: 5, salary: 4833.57, expenses: 1990.01, investments: 0, bunqTopups: 516.89 },
  { year: 2022, month: 6, salary: 2942.74, expenses: 4172.16, investments: 0, bunqTopups: 912.23 },
  { year: 2022, month: 7, salary: 2907.74, expenses: 3204.82, investments: 0, bunqTopups: 1100.13 },
  { year: 2022, month: 8, salary: 2931.74, expenses: 1726.17, investments: 0, bunqTopups: 752.90 },
  { year: 2022, month: 9, salary: 2212.63, expenses: 5843.25, investments: 0, bunqTopups: 500 },
  { year: 2022, month: 10, salary: 2160.11, expenses: 2245.36, investments: 0, bunqTopups: 720.66 },
  { year: 2022, month: 11, salary: 2190.93, expenses: 7929.43, investments: 0, bunqTopups: 67.48 },
  { year: 2022, month: 12, salary: 2162.23, expenses: 3138.56, investments: 0, bunqTopups: 192.97 },
  { year: 2025, month: 10, salary: 4049.64, expenses: 1565.12, investments: 76.40, bunqTopups: 2069.99 },
  { year: 2025, month: 11, salary: 4049.64, expenses: 1772.47, investments: 1000, bunqTopups: 2916.59 },
  { year: 2025, month: 12, salary: 5037.03, expenses: 1565.23, investments: 300, bunqTopups: 2050 },
  { year: 2026, month: 1, salary: 4136.51, expenses: 3842.77, investments: 134.25, bunqTopups: 2650 },
  { year: 2026, month: 2, salary: 4136.51, expenses: 3561.11, investments: 650, bunqTopups: 1580 },
  { year: 2026, month: 3, salary: 4136.51, expenses: 1441.81, investments: 200, bunqTopups: 2381.84 },
  { year: 2026, month: 4, salary: 5649.11, expenses: 2065.90, investments: 900, bunqTopups: 1987.25 },
  { year: 2026, month: 5, salary: 6318.93, expenses: 2770.25, investments: 1000, bunqTopups: 2035.40 },
];
