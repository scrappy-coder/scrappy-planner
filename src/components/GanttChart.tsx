import { useMemo } from "react";
import { Task } from "@/lib/types";
import { FiscalQuarter } from "@/lib/types";
import { cn } from "@/lib/utils";

interface GanttChartProps {
  tasks: Task[];
  quarter: FiscalQuarter;
}

export function GanttChart({ tasks, quarter }: GanttChartProps) {
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
    const start = new Date(task.start_date);
    const end = new Date(task.end_date);
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
        <div className="space-y-1">
          {tasks.map((task) => {
            const bar = getBarStyle(task);
            const isOverdue = new Date(task.end_date) < today && task.status !== "Done";
            return (
              <div key={task.id} className="flex items-center gap-3 h-9">
                <div className="w-40 shrink-0 text-sm truncate pr-2" title={task.name}>
                  <span className={cn(isOverdue && "text-destructive")}>{task.name}</span>
                </div>
                <div className="flex-1 relative h-7 bg-muted/50 rounded-sm">
                  {/* Grid lines for months */}
                  {months.map((m) => (
                    <div
                      key={m.name}
                      className="absolute top-0 h-full border-r border-border/50"
                      style={{ left: `${m.startPct + m.widthPct}%` }}
                    />
                  ))}
                  {/* Today line */}
                  {todayPct !== null && (
                    <div
                      className="absolute top-0 h-full w-px bg-gantt-today z-10"
                      style={{ left: `${todayPct}%` }}
                    >
                      <div className="absolute -top-0.5 -left-1 w-2 h-2 rounded-full bg-gantt-today" />
                    </div>
                  )}
                  {/* Task bar */}
                  {bar && (
                    <div
                      className={cn("absolute top-1 h-5 rounded-sm transition-all", barColor(task))}
                      style={bar}
                      title={`${task.name}: ${task.start_date} → ${task.end_date}`}
                    >
                      <span className="absolute inset-0 flex items-center px-1.5 text-[10px] font-medium text-primary-foreground truncate">
                        {task.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Today legend */}
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
