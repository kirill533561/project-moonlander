export type FinanceVariableType =
  | "income_source"
  | "expense_category"
  | "investment_account"
  | "bank_account";

export interface SubField {
  key: string;
  label: string;
  type: "number" | "text";
}

export interface FinanceVariable {
  id: string;
  user_id: string;
  name: string;
  type: FinanceVariableType;
  sub_fields: SubField[];
  sort_order: number;
  created_at: string;
}

export interface FinanceEntry {
  id: string;
  user_id: string;
  variable_id: string;
  year: number;
  month: number;
  data: Record<string, number | string | null>;
  created_at: string;
  updated_at: string;
}

export interface FinanceSummary {
  id: string;
  user_id: string;
  year: number;
  month: number;
  net_income: number | null;
  total: number | null;
  change: number | null;
  comments: string | null;
  pure_living_expenses: number | null;
  created_at: string;
  updated_at: string;
}

export interface NetworthEntry {
  id: string;
  user_id: string;
  year: number;
  networth: number;
  growth_pct: number | null;
}

export type GoalCategory =
  | "long_range_dream"
  | "economic"
  | "things_i_want"
  | "personal_development";

export type GoalTargetType = "cumulative" | "end_of_year";

export type GoalTrackingType = "checkmark" | "ratio" | "counter";

export interface Goal {
  id: string;
  user_id: string;
  year: number;
  category: GoalCategory;
  name: string;
  target_value: number | null;
  target_type: GoalTargetType | null;
  tracking_type: GoalTrackingType;
  monthly_target: number | null;
  achieved: boolean;
  sort_order: number;
  created_at: string;
}

export interface GoalEntry {
  id: string;
  goal_id: string;
  user_id: string;
  year: number;
  month: number;
  value: number | null;
  achieved: boolean;
  created_at: string;
  updated_at: string;
}

export interface StockHolding {
  id: string;
  user_id: string;
  ticker: string;
  quantity: number;
  total_value: number;
  action: string | null;
  created_at: string;
}

export interface StockTarget {
  id: string;
  user_id: string;
  ticker: string;
  quantity: number;
  target_price: number;
  total: number;
  pct_allocated: number;
  created_at: string;
}

export interface Reward {
  id: string;
  user_id: string;
  year: number;
  month: number | null;
  type: "monthly" | "yearly";
  badge_name: string;
  badge_level: string;
  earned_at: string;
}

export const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

export const MONTH_FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;
