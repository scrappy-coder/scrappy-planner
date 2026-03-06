export type TaskStatus = "Not Started" | "In Progress" | "Done" | "Blocked";

export interface Task {
  id: string;
  project_id: string;
  name: string;
  start_date: string; // ISO date string
  end_date: string;
  status: TaskStatus;
  detail: string;
}

export interface Project {
  id: string;
  name: string;
  created_at: string;
}

export type RiskLevel = "On Track" | "At Risk";

export interface RiskInfo {
  level: RiskLevel;
  reasons: string[];
}

export interface ProjectSummary {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  nextDueDate: string | null;
}

export interface FiscalQuarter {
  label: string;
  start: Date;
  end: Date;
  year: number;
  quarter: number;
}
