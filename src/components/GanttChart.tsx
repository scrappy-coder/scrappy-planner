import { useMemo, useState } from "react";
import { Task } from "@/lib/types";
import { FiscalQuarter } from "@/lib/types";
import { cn } from "@/lib/utils";
import { parseLocalDate } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface GanttChartProps {
  tasks: Task[];
  quarter: FiscalQuarter;
}

export function GanttChart({ tasks, quarter }: GanttChartProps) {
  const [hideCompleted, setHideCompleted] = useState(true);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalDays = useMemo(() => {
    return Math.ceil((quarter.end.getTime() - quarter.start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }, [quarter]);

  const months = useMemo(() => {
    const result: { name: string; startPct: number; widthPct: number }[] = [];
    const d = new Date(quarter.start);
    while (d <= quarter.end) {
      const monthStart = new Date(d);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const effectiveEnd = monthEnd > quarter.end ? quarter.end : monthEnd;
      const startDay = Math.ceil((monthStart.getTime() - quarter.start.getTime()) / (1000 * 60 * 60 * 24));
      const endDay = Math.ceil((effectiveEnd.getTime() - quarter.start.getTime()) / (1000 * 60 * 60 * 24));
      result.push({
        name: monthStart.toLocaleString("default", { month: "short", year: "numeric" }),
        startPct: (startDay / totalDays) * 100,
        widthPct: ((endDay - startDay + 1) / totalDays) * 100,
      });
      d.setMonth(d.getMonth() + 1);
      d.setDate(1);
    }
    return result;
  }, [quarter, totalDays]);

  const todayPct = useMemo(() => {
    if (today < quarter.start || today > quarter.end) return null;
    const dayOffset = Math.ceil((today.getTime() - quarter.start.getTime()) / (1000 * 60 * 60 * 24));
    return (dayOffset / totalDays) * 100;
  }, [today, quarter, totalDays]);

  const getBarStyle = (task: Task) => {
    const start = parseLocalDate(task.start_date);
    const end = parseLocalDate(task.end_date);
    const effectiveStart = start < quarter.start ? quarter.start : start;
    const effectiveEnd = end > quarter.end ? quarter.end : end;

    if (effectiveStart > quarter.end || effectiveEnd < quarter.start) return null;

    const startDay = Math.max(0, Math.ceil((effectiveStart.getTime() - quarter.start.getTime()) / (1000 * 60 * 60 * 24)));
    const endDay = Math.ceil((effectiveEnd.getTime() - quarter.start.getTime()) / (1000 * 60 * 60 * 24));

    return {
      left: `${(startDay / totalDays) * 100}%`,
      width: `${(Math.max(1, endDay - startDay + 1) / totalDays) * 100}%`,
    };
  };

  const barColor = (task: Task) => {
    switch (task.status) {
      case "Done": return "bg-gantt-bar-done";
      case "Blocked": return "bg-gantt-bar-blocked";
      case "Not Started": return "bg-gantt-bar-not-started";
      default: return "bg-gantt-bar";
    }
  };

  // Build hierarchical task list: parents with their children indented
  const orderedTasks = useMemo(() => {
    const parentTasks = tasks.filter((t) => !t.parent_id);
    const result: { task: Task; isChild: boolean }[] = [];
    for (const parent of parentTasks) {
      result.push({ task: parent, isChild: false });
      const children = tasks.filter((t) => t.parent_id === parent.id);
      for (const child of children) {
        result.push({ task: child, isChild: true });
      }
    }
    return result;
  }, [tasks]);

  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
        No tasks yet. Add a task to see the Gantt chart.
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[600px]">
        {/* Month headers */}
        <div className="relative h-8 border-b border-border mb-1">
          {months.map((m) => (
            <div
              key={m.name}
              className="absolute top-0 h-full flex items-center px-2 text-xs font-medium text-muted-foreground border-r border-border"
              style={{ left: `${m.startPct}%`, width: `${m.widthPct}%` }}
            >
              {m.name}
            </div>
          ))}
        </div>

        {/* Task rows */}
        <div className="space-y-0.5">
          {orderedTasks.map(({ task, isChild }) => {
            const bar = getBarStyle(task);
            const isOverdue = parseLocalDate(task.end_date) < today && task.status !== "Done";
            return (
              <div key={task.id} className={cn("flex items-center gap-3", isChild ? "h-7" : "h-9")}>
                <div
                  className={cn(
                    "shrink-0 text-sm truncate pr-2",
                    isChild ? "w-40 pl-5" : "w-40"
                  )}
                  title={task.name}
                >
                  <span className={cn(
                    isOverdue && "text-destructive",
                    isChild && "text-xs text-muted-foreground"
                  )}>
                    {isChild && "└ "}{task.name}
                  </span>
                </div>
                <div className="flex-1 relative h-full rounded-sm bg-[#cfbfdf]/[0.26]">
                  {months.map((m) => (
                    <div
                      key={m.name}
                      className="absolute top-0 h-full border-r border-border/50"
                      style={{ left: `${m.startPct + m.widthPct}%` }}
                    />
                  ))}
                  {todayPct !== null && (
                    <div
                      className="absolute top-0 h-full w-px bg-gantt-today z-10"
                      style={{ left: `${todayPct}%` }}
                    >
                      <div className="absolute -top-0.5 -left-1 w-2 h-2 rounded-full bg-gantt-today" />
                    </div>
                  )}
                  {bar && (
                    <div
                      className={cn(
                        "absolute rounded-sm transition-all",
                        barColor(task),
                        isChild ? "top-1 h-5" : "top-1.5 h-6"
                      )}
                      style={bar}
                      title={`${task.name}: ${task.start_date} → ${task.end_date}`}
                    >
                      <span className={cn(
                        "absolute inset-0 flex items-center px-1.5 font-medium text-primary-foreground truncate",
                        isChild ? "text-[9px]" : "text-[10px]"
                      )}>
                        {task.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {todayPct !== null && (
          <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-gantt-today" />
            Today ({today.toLocaleDateString()})
          </div>
        )}
      </div>
    </div>
  );
}
