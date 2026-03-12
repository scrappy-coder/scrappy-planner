export type TaskStatus = "Not Started" | "In Progress" | "In Review" | "Done" | "Blocked";

export type EffortSize = "xs" | "s" | "m" | "l" | "xl";

export const EFFORT_VALUES: Record<EffortSize, number> = {
  xs: 1,
  s: 2,
  m: 3,
  l: 5,
  xl: 8,
};

export const EFFORT_SIZES: EffortSize[] = ["xs", "s", "m", "l", "xl"];

export interface Task {
  id: string;
  project_id: string;
  name: string;
  start_date: string; // ISO date string
  end_date: string;
  status: TaskStatus;
  detail: string;
  parent_id: string | null;
  effort: EffortSize;
  fiscal_quarter: string; // e.g. "Q1 FY2027"
}

export interface Project {
  id: string;
  name: string;
  created_at: string;
  fiscal_quarter: string;
}

export type RiskLevel = "On Track" | "Behind Schedule" | "At Risk";

export interface RiskInfo {
  level: RiskLevel;
  reasons: string[];
}

export interface ProjectSummary {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  behindSchedule: number;
  nextDueDate: string | null;
}

export interface FiscalQuarter {
  label: string;
  start: Date;
  end: Date;
  year: number;
  quarter: number;
}
