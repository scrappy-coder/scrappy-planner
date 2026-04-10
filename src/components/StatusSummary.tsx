import { ProjectSummary } from "@/lib/types";

function getMessage(s: ProjectSummary): string {
  const { totalTasks, completedTasks, overdueTasks, behindSchedule, nextDueDate } = s;

  if (totalTasks === 0) return "";

  const pctDone = Math.round((completedTasks / totalTasks) * 100);
  const remaining = totalTasks - completedTasks;

  // All done
  if (completedTasks === totalTasks) {
    return "🎉 You've completed everything — nice work! Time to plan the next sprint.";
  }

  // Critical: lots overdue
  if (overdueTasks >= 3) {
    return `⚠️ Heads up — you have ${overdueTasks} overdue tasks piling up. Consider re-prioritizing or adjusting deadlines to get back on track.`;
  }

  // Some overdue + behind
  if (overdueTasks > 0 && behindSchedule > 0) {
    return `🔴 ${overdueTasks} task${overdueTasks > 1 ? "s are" : " is"} overdue and ${behindSchedule} ${behindSchedule > 1 ? "are" : "is"} falling behind schedule. Focus on clearing the overdue items first.`;
  }

  // Only overdue
  if (overdueTasks > 0) {
    return `⏰ ${overdueTasks} task${overdueTasks > 1 ? "s have" : " has"} slipped past ${overdueTasks > 1 ? "their" : "its"} due date. Try to wrap ${overdueTasks > 1 ? "them" : "it"} up soon to stay on track.`;
  }

  // Behind schedule only
  if (behindSchedule > 0) {
    return `🟠 ${behindSchedule} task${behindSchedule > 1 ? "s are" : " is"} behind schedule. You might want to pick up the pace or adjust your timelines.`;
  }

  // Great progress
  if (pctDone >= 75) {
    return `🚀 You're ${pctDone}% done — just ${remaining} task${remaining > 1 ? "s" : ""} left. The finish line is in sight!`;
  }

  if (pctDone >= 50) {
    return `💪 Over halfway there at ${pctDone}% complete. Keep the momentum going — ${remaining} task${remaining > 1 ? "s" : ""} to go.`;
  }

  if (pctDone >= 25) {
    return `📋 You're ${pctDone}% through your tasks. Steady progress — keep chipping away at the remaining ${remaining}.`;
  }

  // Just getting started
  if (completedTasks === 0) {
    const dueSoon = nextDueDate
      ? (() => {
          const [y, m, d] = nextDueDate.split("-").map(Number);
          return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        })()
      : null;
    return dueSoon
      ? `📌 ${totalTasks} tasks on your plate with the next one due ${dueSoon}. Time to get started!`
      : `📌 ${totalTasks} tasks queued up — let's get moving!`;
  }

  return `📋 ${completedTasks} of ${totalTasks} tasks done so far. Keep it up!`;
}

export function StatusSummary({ summary }: { summary: ProjectSummary }) {
  const msg = getMessage(summary);
  if (!msg) return null;

  return (
    <div className="border border-dashed border-primary rounded-lg px-4 py-3 bg-primary/5">
      <p className="text-sm text-muted-foreground italic">
        {msg}
      </p>
    </div>
  );
}
