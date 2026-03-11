import { Task, RiskInfo, ProjectSummary } from "./types";

export function assessRisk(tasks: Task[]): RiskInfo {
  if (tasks.length === 0) return { level: "On Track", reasons: [] };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const in14Days = new Date(today);
  in14Days.setDate(in14Days.getDate() + 14);

  const reasons: string[] = [];

  // a) Tasks with end date in the past and not Done
  const overdueTasks = tasks.filter((t) => {
    const end = new Date(t.end_date);
    return end < today && t.status !== "Done";
  });

  if (overdueTasks.length > 0) {
    reasons.push(`${overdueTasks.length} overdue task${overdueTasks.length > 1 ? "s" : ""}`);
  }

  // b) Blocked task whose end date is within 14 days or already passed
  const blockedUrgent = tasks.filter((t) => {
    if (t.status !== "Blocked") return false;
    const end = new Date(t.end_date);
    return end <= in14Days;
  });

  if (blockedUrgent.length > 0) {
    reasons.push(`Blocked task${blockedUrgent.length > 1 ? "s" : ""} due soon`);
  }

  // c) More than 30% of tasks overdue and not Done
  if (tasks.length > 0 && overdueTasks.length / tasks.length > 0.3) {
    if (!reasons.some((r) => r.includes("overdue"))) {
      reasons.push(`${Math.round((overdueTasks.length / tasks.length) * 100)}% tasks overdue`);
    }
  }

  return {
    level: reasons.length > 0 ? "At Risk" : "On Track",
    reasons,
  };
}

export function getProjectSummary(tasks: Task[]): ProjectSummary {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parseDate = (s: string) => {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
  };

  const completedTasks = tasks.filter((t) => t.status === "Done").length;
  const overdueTasks = tasks.filter((t) => {
    return parseDate(t.end_date) < today && t.status !== "Done";
  }).length;

  const futureDates = tasks
    .filter((t) => parseDate(t.end_date) >= today && t.status !== "Done")
    .map((t) => t.end_date)
    .sort();

  return {
    totalTasks: tasks.length,
    completedTasks,
    overdueTasks,
    nextDueDate: futureDates[0] || null,
  };
}
