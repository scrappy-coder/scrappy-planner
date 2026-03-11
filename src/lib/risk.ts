import { Task, RiskInfo, ProjectSummary } from "./types";
import { parseLocalDate } from "./utils";

export function assessRisk(tasks: Task[]): RiskInfo {
  if (tasks.length === 0) return { level: "On Track", reasons: [] };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const in14Days = new Date(today);
  in14Days.setDate(in14Days.getDate() + 14);

  const reasons: string[] = [];
  const behindReasons: string[] = [];

  // a) Tasks with end date in the past and not Done
  const overdueTasks = tasks.filter((t) => {
    const end = parseLocalDate(t.end_date);
    return end < today && t.status !== "Done";
  });

  if (overdueTasks.length > 0) {
    reasons.push(`${overdueTasks.length} overdue task${overdueTasks.length > 1 ? "s" : ""}`);
  }

  // b) Blocked task whose end date is within 14 days or already passed
  const blockedUrgent = tasks.filter((t) => {
    if (t.status !== "Blocked") return false;
    const end = parseLocalDate(t.end_date);
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

  // d) Behind schedule: past start date but not started, or past end date but still in progress
  const behindTasks = tasks.filter((t) => {
    if (t.status === "Done") return false;
    const start = parseLocalDate(t.start_date);
    const end = parseLocalDate(t.end_date);
    return (start < today && t.status === "Not Started") || (end < today && t.status === "In Progress");
  });

  if (behindTasks.length > 0) {
    behindReasons.push(`${behindTasks.length} task${behindTasks.length > 1 ? "s" : ""} behind schedule`);
  }

  if (reasons.length > 0) {
    return { level: "At Risk", reasons };
  }
  if (behindReasons.length > 0) {
    return { level: "Behind Schedule", reasons: behindReasons };
  }
  return { level: "On Track", reasons: [] };
}

export function getProjectSummary(tasks: Task[]): ProjectSummary {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const completedTasks = tasks.filter((t) => t.status === "Done").length;
  const overdueTasks = tasks.filter((t) => {
    return parseLocalDate(t.end_date) < today && t.status !== "Done";
  }).length;

  const behindSchedule = tasks.filter((t) => {
    if (t.status === "Done") return false;
    const start = parseLocalDate(t.start_date);
    const end = parseLocalDate(t.end_date);
    // Past start date but not started, or past end date but still in progress
    return (start < today && t.status === "Not Started") || (end < today && t.status === "In Progress");
  }).length;

  const futureDates = tasks
    .filter((t) => parseLocalDate(t.end_date) >= today && t.status !== "Done")
    .map((t) => t.end_date)
    .sort();

  return {
    totalTasks: tasks.length,
    completedTasks,
    overdueTasks,
    behindSchedule,
    nextDueDate: futureDates[0] || null,
  };
}
