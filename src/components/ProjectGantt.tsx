import { useMemo, useState } from "react";
import { Project, Task } from "@/lib/types";
import { getProjectColor } from "@/lib/colors";
import { cn } from "@/lib/utils";
import { parseLocalDate } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface ProjectGanttProps {
  projects: Project[];
  tasks: Task[];
  onSelectProject?: (projectId: string) => void;
}

interface ProjectBar {
  project: Project;
  minDate: Date;
  maxDate: Date;
  totalTasks: number;
  completedTasks: number;
  allDone: boolean;
}

export function ProjectGantt({ projects, tasks, onSelectProject }: ProjectGanttProps) {
  const [hideCompleted, setHideCompleted] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const projectIds = useMemo(() => projects.map((p) => p.id), [projects]);

  const projectBars = useMemo(() => {
    return projects
      .map((project) => {
        const projectTasks = tasks.filter((t) => t.project_id === project.id);
        if (projectTasks.length === 0) return null;

        const dates = projectTasks.flatMap((t) => [new Date(t.start_date), new Date(t.end_date)]);
        const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
        const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));
        const completedTasks = projectTasks.filter((t) => t.status === "Done").length;

        return {
          project,
          minDate,
          maxDate,
          totalTasks: projectTasks.length,
          completedTasks,
          allDone: completedTasks === projectTasks.length,
        } as ProjectBar;
      })
      .filter(Boolean) as ProjectBar[];
  }, [projects, tasks]);

  const filtered = useMemo(
    () => (hideCompleted ? projectBars.filter((b) => !b.allDone) : projectBars),
    [projectBars, hideCompleted]
  );

  const { globalMin, globalMax, totalDays } = useMemo(() => {
    if (filtered.length === 0) return { globalMin: new Date(), globalMax: new Date(), totalDays: 1 };
    const min = new Date(Math.min(...filtered.map((b) => b.minDate.getTime())));
    const max = new Date(Math.max(...filtered.map((b) => b.maxDate.getTime())));
    const days = Math.max(1, Math.ceil((max.getTime() - min.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    return { globalMin: min, globalMax: max, totalDays: days };
  }, [filtered]);

  const months = useMemo(() => {
    const result: { name: string; startPct: number; widthPct: number }[] = [];
    const d = new Date(globalMin);
    d.setDate(1);
    while (d <= globalMax) {
      const monthStart = new Date(Math.max(d.getTime(), globalMin.getTime()));
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const effectiveEnd = monthEnd > globalMax ? globalMax : monthEnd;
      const startDay = Math.max(0, Math.ceil((monthStart.getTime() - globalMin.getTime()) / (1000 * 60 * 60 * 24)));
      const endDay = Math.ceil((effectiveEnd.getTime() - globalMin.getTime()) / (1000 * 60 * 60 * 24));
      result.push({
        name: monthStart.toLocaleString("default", { month: "short", year: "numeric" }),
        startPct: (startDay / totalDays) * 100,
        widthPct: ((endDay - startDay + 1) / totalDays) * 100,
      });
      d.setMonth(d.getMonth() + 1);
      d.setDate(1);
    }
    return result;
  }, [globalMin, globalMax, totalDays]);

  const todayPct = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (today < globalMin || today > globalMax) return null;
    const offset = Math.ceil((today.getTime() - globalMin.getTime()) / (1000 * 60 * 60 * 24));
    return (offset / totalDays) * 100;
  }, [globalMin, globalMax, totalDays]);

  const handleClick = (id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
    onSelectProject?.(id);
  };

  if (projectBars.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-6">
        No projects with tasks to display.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Checkbox
          id="hide-completed"
          checked={hideCompleted}
          onCheckedChange={(v) => setHideCompleted(!!v)}
        />
        <Label htmlFor="hide-completed" className="text-xs text-muted-foreground cursor-pointer">
          Hide completed projects
        </Label>
      </div>

      <div className="w-full overflow-x-auto">
        <div className="min-w-[500px]">
          {/* Month headers */}
          <div className="relative h-7 border-b border-border mb-1">
            {months.map((m) => (
              <div
                key={m.name}
                className="absolute top-0 h-full flex items-center px-1 text-[10px] font-medium text-muted-foreground border-r border-border overflow-hidden whitespace-nowrap"
                style={{ left: `${m.startPct}%`, width: `${m.widthPct}%` }}
              >
                {m.name}
              </div>
            ))}
          </div>

          {/* Project rows */}
          <div className="space-y-1">
            {filtered.map((bar) => {
              const startDay = Math.max(
                0,
                Math.ceil((bar.minDate.getTime() - globalMin.getTime()) / (1000 * 60 * 60 * 24))
              );
              const endDay = Math.ceil(
                (bar.maxDate.getTime() - globalMin.getTime()) / (1000 * 60 * 60 * 24))
              ;
              const leftPct = (startDay / totalDays) * 100;
              const widthPct = (Math.max(1, endDay - startDay + 1) / totalDays) * 100;
              const isSelected = selectedId === bar.project.id;
              const barColor = getProjectColor(bar.project.id, projectIds);

              return (
                <div
                  key={bar.project.id}
                  className={cn(
                    "flex items-center gap-3 h-9 cursor-pointer rounded-sm px-1 transition-colors",
                    isSelected ? "bg-accent" : "hover:bg-accent/50"
                  )}
                  onClick={() => handleClick(bar.project.id)}
                >
                  <div className="w-36 shrink-0 text-sm truncate pr-2 font-medium" title={bar.project.name}>
                    {bar.project.name}
                  </div>
                  <div className="flex-1 relative h-6 rounded-sm bg-muted/20">
                    {/* Grid lines */}
                    {months.map((m) => (
                      <div
                        key={m.name}
                        className="absolute top-0 h-full border-r border-border/30"
                        style={{ left: `${m.startPct + m.widthPct}%` }}
                      />
                    ))}
                    {/* Today */}
                    {todayPct !== null && (
                      <div
                        className="absolute top-0 h-full w-px bg-gantt-today z-10"
                        style={{ left: `${todayPct}%` }}
                      />
                    )}
                    {/* Bar */}
                    <div
                      className="absolute top-1 h-4 rounded-sm transition-all"
                      style={{
                        left: `${leftPct}%`,
                        width: `${widthPct}%`,
                        backgroundColor: barColor,
                        opacity: bar.allDone ? 0.6 : 1,
                      }}
                      title={`${bar.project.name}: ${bar.completedTasks}/${bar.totalTasks} done`}
                    >
                      <span className="absolute inset-0 flex items-center px-1.5 text-[10px] font-medium text-white truncate">
                        {bar.completedTasks}/{bar.totalTasks}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {todayPct !== null && (
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-gantt-today" />
              Today ({new Date().toLocaleDateString()})
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
